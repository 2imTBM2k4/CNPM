import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import axios from "axios";
import MapView, { Marker } from "react-native-maps";
import { io } from "socket.io-client";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:4000").replace(/\/$/, "");
const BACKGROUND_LOCATION_TASK = "drone-food-shipper-location";
const TOKEN_KEY = "shipperAccessToken";
const REFRESH_TOKEN_KEY = "shipperRefreshToken";
const queryClient = new QueryClient();

type ShipperStatus = "offline" | "available" | "assigned" | "delivering";
type Coordinates = { latitude: number; longitude: number };
type Registration = { name: string; email: string; phone: string; address: string; password: string };
type Profile = { status: ShipperStatus; approvalStatus: "pending" | "approved" | "rejected"; vehicleType: string; locationUpdatedAt?: string; currentOrder?: string | null };
type User = { name: string; email: string; role: string };
type Order = {
  _id: string; orderStatus: "pending" | "preparing" | "delivering" | "delivered" | "cancelled";
  totalPrice: number; shippingPrice: number; createdAt: string; deliveryMethod: "shipper";
  shippingAddress: { fullName: string; address: string; city: string; state: string; phone: string; lat?: number; lng?: number };
  restaurantId?: { name: string; address: string; phone?: string; lat?: number; lng?: number };
  orderItems: { name: string; quantity: number; selectedOptions?: { groupName: string; optionName: string }[]; note?: string }[];
  shipperAssignmentDeadlineAt?: string;
};

const formatVnd = (value = 0) => `${Math.round(value).toLocaleString("vi-VN")} ₫`;
const apiError = (error: unknown, fallback = "Có lỗi xảy ra") => axios.isAxiosError(error) ? error.response?.data?.message || fallback : fallback;
const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });
const statusLabel: Record<ShipperStatus, string> = { offline: "Ngoại tuyến", available: "Sẵn sàng nhận đơn", assigned: "Đã nhận đơn", delivering: "Đang giao" };

async function sendBackgroundLocation(coordinates: Coordinates) {
  let token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return;
  try {
    await axios.put(`${API_URL}/api/shippers/me/location`, { lat: coordinates.latitude, lng: coordinates.longitude }, { headers: authHeaders(token) });
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw error;
    const refreshed = await axios.post<{ token: string }>(`${API_URL}/api/user/refresh-token`, { refreshToken });
    token = refreshed.data.token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await axios.put(`${API_URL}/api/shippers/me/location`, { lat: coordinates.latitude, lng: coordinates.longitude }, { headers: authHeaders(token) });
  }
}

type LocationTaskData = { locations: Location.LocationObject[] };

TaskManager.defineTask<LocationTaskData>(BACKGROUND_LOCATION_TASK, async ({ data, error }: TaskManager.TaskManagerTaskBody<LocationTaskData>) => {
  if (error || !data) return;
  const locations = data.locations;
  const latest = locations[locations.length - 1];
  if (!latest) return;
  try {
    await sendBackgroundLocation({ latitude: latest.coords.latitude, longitude: latest.coords.longitude });
  } catch {
    // The foreground app retries on the next location update. A background task must not crash the OS worker.
  }
});

function ShipperApp() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"offers" | "delivery" | "account">("offers");
  const [working, setWorking] = useState(false);
  const watcher = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => { SecureStore.getItemAsync(TOKEN_KEY).then(setToken); }, []);

  const user = useQuery({
    queryKey: ["shipper-user", token],
    enabled: Boolean(token),
    queryFn: async () => (await axios.get<{ data: User }>(`${API_URL}/api/user/me`, { headers: authHeaders(token!) })).data.data,
  });
  const profile = useQuery({
    queryKey: ["shipper-profile", token],
    enabled: Boolean(token),
    queryFn: async () => (await axios.get<{ data: Profile }>(`${API_URL}/api/shippers/me`, { headers: authHeaders(token!) })).data.data,
    refetchInterval: 30000,
  });
  const offers = useQuery({
    queryKey: ["shipper-offers", token],
    enabled: Boolean(token && profile.data?.status === "available" && profile.data?.approvalStatus === "approved"),
    queryFn: async () => (await axios.get<{ data: Order[] }>(`${API_URL}/api/shippers/me/orders/available`, { headers: authHeaders(token!) })).data.data || [],
    refetchInterval: 30000,
  });
  const currentOrder = useQuery({
    queryKey: ["shipper-current-order", token],
    enabled: Boolean(token),
    queryFn: async () => (await axios.get<{ data: Order | null }>(`${API_URL}/api/shippers/me/orders/current`, { headers: authHeaders(token!) })).data.data,
    refetchInterval: profile.data?.currentOrder ? 15000 : false,
  });

  const isApproved = profile.data?.approvalStatus === "approved";
  const isWorking = profile.data?.status === "assigned" || profile.data?.status === "delivering";

  const refreshViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["shipper-profile", token] }),
      queryClient.invalidateQueries({ queryKey: ["shipper-offers", token] }),
      queryClient.invalidateQueries({ queryKey: ["shipper-current-order", token] }),
    ]);
  };

  const pushLocation = async (coords: Coordinates) => {
    if (!token) return;
    await sendBackgroundLocation(coords);
    const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    if (storedToken && storedToken !== token) setToken(storedToken);
  };

  const getCurrentLocation = async (): Promise<Coordinates> => {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== "granted") throw new Error("Cần cho phép vị trí để nhận đơn trong phạm vi tối đa 5 km.");
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  };

  const beginLocationTracking = async (initialLocation: Coordinates) => {
    await pushLocation(initialLocation);
    watcher.current?.remove();
    watcher.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 20000 },
      (next) => pushLocation({ latitude: next.coords.latitude, longitude: next.coords.longitude }).catch(() => undefined),
    );

    // Background tracking is a progressive enhancement. Expo Go or a device
    // setting can reject it, but foreground tracking must remain usable.
    try {
      const background = await Location.requestBackgroundPermissionsAsync();
      if (background.status === "granted" && !(await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK))) {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50,
          timeInterval: 20000,
          foregroundService: { notificationTitle: "Drone Food Shipper", notificationBody: "Đang cập nhật vị trí để nhận và giao đơn." },
        });
      }
    } catch {
      // Foreground updates continue when background tracking is unavailable.
    }
  };

  useEffect(() => () => watcher.current?.remove(), []);
  useEffect(() => {
    if (!token) return undefined;
    const socket = io(API_URL, { auth: { token }, transports: ["websocket", "polling"] });
    socket.on("connect", () => socket.emit("joinShipper"));
    socket.on("shipperOrderOffer", () => {
      queryClient.invalidateQueries({ queryKey: ["shipper-offers", token] });
      setTab("offers");
    });
    return () => { socket.disconnect(); };
  }, [token]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active" && profile.data?.status !== "offline") refreshViews();
    });
    return () => listener.remove();
  }, [profile.data?.status, token]);

  const login = async () => {
    try {
      setWorking(true); setLoginError("");
      const response = await axios.post(`${API_URL}/api/user/login`, { email: email.trim(), password });
      if (response.data.role !== "shipper") throw new Error("Tài khoản này không phải tài khoản Shipper.");
      await SecureStore.setItemAsync(TOKEN_KEY, response.data.token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.data.refreshToken || "");
      setToken(response.data.token);
    } catch (error) { setLoginError(apiError(error, error instanceof Error ? error.message : "Đăng nhập thất bại")); }
    finally { setWorking(false); }
  };
  const register = async (details: Registration) => {
    if (details.name.trim().length < 2) return setLoginError("Tên phải có ít nhất 2 ký tự.");
    if (!details.phone.trim()) return setLoginError("Số điện thoại là bắt buộc để nhà hàng và khách liên hệ Shipper.");
    if (details.password.length < 8) return setLoginError("Mật khẩu phải có ít nhất 8 ký tự.");
    try {
      setWorking(true); setLoginError("");
      const response = await axios.post(`${API_URL}/api/user/register`, {
        name: details.name.trim(),
        email: details.email.trim(),
        phone: details.phone.trim(),
        address: details.address.trim(),
        password: details.password,
        role: "shipper",
      });
      await SecureStore.setItemAsync(TOKEN_KEY, response.data.token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.data.refreshToken || "");
      setToken(response.data.token);
      Alert.alert("Đăng ký thành công", "Tài khoản đang chờ Admin duyệt. Bạn sẽ chưa thể bật trạng thái nhận đơn cho đến khi được duyệt.");
    } catch (error) { setLoginError(apiError(error, "Không thể đăng ký. Hãy kiểm tra lại thông tin và thử lại.")); }
    finally { setWorking(false); }
  };
  const logout = async () => {
    watcher.current?.remove();
    if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    await SecureStore.deleteItemAsync(TOKEN_KEY); await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    queryClient.clear(); setToken(null); setTab("offers");
  };
  const changeStatus = async () => {
    if (!token || !isApproved || working) return;
    try {
      setWorking(true);
      if (profile.data?.status === "offline") {
        const initialLocation = await getCurrentLocation();
        await axios.put(`${API_URL}/api/shippers/me/status`, { status: "available" }, { headers: authHeaders(token) });
        try {
          await beginLocationTracking(initialLocation);
        } catch (error) {
          await axios.put(`${API_URL}/api/shippers/me/status`, { status: "offline" }, { headers: authHeaders(token) }).catch(() => undefined);
          throw error;
        }
      } else {
        await axios.put(`${API_URL}/api/shippers/me/status`, { status: "offline" }, { headers: authHeaders(token) });
        watcher.current?.remove(); watcher.current = null;
        if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      }
      await refreshViews();
    } catch (error) { Alert.alert("Không thể đổi trạng thái", apiError(error)); }
    finally { setWorking(false); }
  };
  const acceptOrder = async (order: Order) => {
    if (!token) return;
    try {
      setWorking(true);
      await axios.post(`${API_URL}/api/shippers/me/orders/${order._id}/accept`, {}, { headers: authHeaders(token) });
      setTab("delivery"); await refreshViews();
    } catch (error) { Alert.alert("Không thể nhận đơn", apiError(error)); await refreshViews(); }
    finally { setWorking(false); }
  };
  const advanceDelivery = async () => {
    if (!token || !currentOrder.data) return;
    const endpoint = currentOrder.data.orderStatus === "preparing" ? "pick-up" : "complete";
    try {
      setWorking(true);
      await axios.post(`${API_URL}/api/shippers/me/orders/${currentOrder.data._id}/${endpoint}`, {}, { headers: authHeaders(token) });
      await refreshViews();
    } catch (error) { Alert.alert("Không thể cập nhật đơn", apiError(error)); }
    finally { setWorking(false); }
  };

  if (!token) return <LoginScreen email={email} password={password} error={loginError} working={working} onEmail={setEmail} onPassword={setPassword} onLogin={login} onRegister={register} />;
  if (user.isLoading || profile.isLoading) return <Loading />;
  if (user.data?.role !== "shipper") return <SafeAreaView style={styles.center}><Text style={styles.error}>Tài khoản không có quyền Shipper.</Text><PrimaryButton label="Đăng xuất" onPress={logout} /></SafeAreaView>;

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View style={styles.header}><View><Text style={styles.brand}>Drone Food Shipper</Text><Text style={styles.muted}>{user.data.name} · {statusLabel[profile.data?.status || "offline"]}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Đăng xuất" onPress={logout}><Text style={styles.link}>Thoát</Text></Pressable></View>
    {!isApproved ? <ApprovalScreen status={profile.data?.approvalStatus || "pending"} /> : <>
      {tab === "offers" && <OffersScreen orders={offers.data || []} loading={offers.isLoading} online={profile.data?.status === "available"} working={working} onRefresh={refreshViews} onAccept={acceptOrder} />}
      {tab === "delivery" && <DeliveryScreen order={currentOrder.data || null} loading={currentOrder.isLoading} working={working} onAdvance={advanceDelivery} />}
      {tab === "account" && <AccountScreen profile={profile.data} working={working} isWorking={isWorking} onToggle={changeStatus} />}
      <BottomNav active={tab} onChange={setTab} hasDelivery={Boolean(currentOrder.data)} />
    </>}
  </SafeAreaView>;
}

function LoginScreen({ email, password, error, working, onEmail, onPassword, onLogin, onRegister }: { email: string; password: string; error: string; working: boolean; onEmail: (value: string) => void; onPassword: (value: string) => void; onLogin: () => void; onRegister: (details: Registration) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registration, setRegistration] = useState<Registration>({ name: "", email: "", phone: "", address: "", password: "" });
  const change = (key: keyof Registration, value: string) => setRegistration((current) => ({ ...current, [key]: value }));
  return <SafeAreaView style={styles.login}><ScrollView contentContainerStyle={styles.authForm} keyboardShouldPersistTaps="handled"><Text style={styles.brand}>Drone Food Shipper</Text><Text style={styles.subtitle}>{mode === "login" ? "Nhận đơn trong bán kính tối đa 5 km quanh nhà hàng." : "Tạo tài khoản để đăng ký làm Shipper."}</Text>
    {mode === "login" ? <><FormField label="Email" value={email} placeholder="email@example.com" keyboardType="email-address" onChange={onEmail} /><FormField label="Mật khẩu" value={password} placeholder="Ít nhất 8 ký tự" secure onChange={onPassword} /><PrimaryButton label="Đăng nhập" disabled={working} onPress={onLogin} /><SecondaryButton label="Chưa có tài khoản? Đăng ký Shipper" disabled={working} onPress={() => setMode("register")} /></> : <><FormField label="Họ và tên *" value={registration.name} placeholder="Nguyễn Văn A" onChange={(value) => change("name", value)} /><FormField label="Email *" value={registration.email} placeholder="email@example.com" keyboardType="email-address" onChange={(value) => change("email", value)} /><FormField label="Số điện thoại *" value={registration.phone} placeholder="0901234567" keyboardType="phone-pad" onChange={(value) => change("phone", value)} /><FormField label="Địa chỉ hiện tại" value={registration.address} placeholder="Số nhà, đường, phường/xã" onChange={(value) => change("address", value)} /><FormField label="Mật khẩu *" value={registration.password} placeholder="Ít nhất 8 ký tự" secure onChange={(value) => change("password", value)} /><Text style={styles.hint}>Sau khi đăng ký, Admin cần duyệt tài khoản trước khi bạn có thể nhận đơn.</Text><PrimaryButton label="Gửi đăng ký Shipper" disabled={working} onPress={() => onRegister(registration)} /><SecondaryButton label="Đã có tài khoản? Đăng nhập" disabled={working} onPress={() => setMode("login")} /></>}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</ScrollView></SafeAreaView>;
}

function ApprovalScreen({ status }: { status: string }) { return <View style={styles.center}><Text style={styles.screenTitle}>Chờ xác minh tài khoản</Text><Text style={styles.muted}>{status === "rejected" ? "Tài khoản Shipper chưa được duyệt. Hãy liên hệ quản trị viên." : "Admin đang duyệt hồ sơ Shipper của bạn."}</Text></View>; }

function OffersScreen({ orders, loading, online, working, onRefresh, onAccept }: { orders: Order[]; loading: boolean; online: boolean; working: boolean; onRefresh: () => void; onAccept: (order: Order) => void }) {
  if (!online) return <View style={styles.center}><Text style={styles.screenTitle}>Bạn đang ngoại tuyến</Text><Text style={styles.muted}>Mở tab Tài khoản và bật trạng thái sẵn sàng để chia sẻ vị trí, sau đó hệ thống mới tìm đơn trong bán kính tối đa 5 km.</Text></View>;
  return <FlatList contentContainerStyle={styles.list} data={orders} keyExtractor={(item) => item._id} refreshing={loading} onRefresh={onRefresh} ListHeaderComponent={<><Text style={styles.screenTitle}>Đơn gần bạn</Text><Text style={styles.muted}>Chỉ hiển thị đơn còn hạn nhận và nhà hàng trong phạm vi tối đa 5 km từ vị trí mới nhất của bạn.</Text></>} ListEmptyComponent={<Text style={styles.emptyText}>Chưa có đơn phù hợp quanh bạn.</Text>} renderItem={({ item }) => <OrderCard order={item} action="Nhận đơn" working={working} onPress={() => onAccept(item)} />} />;
}

function DeliveryScreen({ order, loading, working, onAdvance }: { order: Order | null; loading: boolean; working: boolean; onAdvance: () => void }) {
  if (loading) return <Loading />;
  if (!order) return <View style={styles.center}><Text style={styles.screenTitle}>Chưa có đơn đang giao</Text><Text style={styles.muted}>Nhận một đơn ở tab Đơn gần bạn để bắt đầu.</Text></View>;
  const restaurant = order.restaurantId;
  const destination = order.shippingAddress;
  const canMap = Number.isFinite(restaurant?.lat) && Number.isFinite(restaurant?.lng) && Number.isFinite(destination.lat) && Number.isFinite(destination.lng);
  const action = order.orderStatus === "preparing" ? "Đã lấy hàng từ nhà hàng" : order.orderStatus === "delivering" ? "Hoàn tất giao hàng" : null;
  return <ScrollView contentContainerStyle={styles.list}><Text style={styles.screenTitle}>Đơn đang thực hiện</Text><OrderCard order={order} working={working} />
    {canMap ? <MapView style={styles.map} initialRegion={{ latitude: ((restaurant!.lat || 0) + (destination.lat || 0)) / 2, longitude: ((restaurant!.lng || 0) + (destination.lng || 0)) / 2, latitudeDelta: Math.max(Math.abs((restaurant!.lat || 0) - (destination.lat || 0)) * 1.8, 0.01), longitudeDelta: Math.max(Math.abs((restaurant!.lng || 0) - (destination.lng || 0)) * 1.8, 0.01) }}><Marker coordinate={{ latitude: restaurant!.lat!, longitude: restaurant!.lng! }} title="Nhà hàng" pinColor="#EA580C" /><Marker coordinate={{ latitude: destination.lat!, longitude: destination.lng! }} title="Khách hàng" pinColor="#2563EB" /></MapView> : null}
    {order.orderStatus === "pending" ? <Text style={styles.notice}>Đã nhận đơn. Chờ nhà hàng xác nhận và chuẩn bị món trước khi đến lấy.</Text> : null}
    {action ? <PrimaryButton label={action} disabled={working} onPress={onAdvance} /> : null}
  </ScrollView>;
}

function AccountScreen({ profile, working, isWorking, onToggle }: { profile?: Profile; working: boolean; isWorking: boolean; onToggle: () => void }) { const online = profile?.status !== "offline"; return <ScrollView contentContainerStyle={styles.list}><Text style={styles.screenTitle}>Tài khoản & vị trí</Text><View style={styles.panel}><Text style={styles.cardTitle}>Trạng thái: {statusLabel[profile?.status || "offline"]}</Text><Text style={styles.muted}>Vị trí được gửi khi ứng dụng đang mở; khi đã cho phép nền, Android/iOS tiếp tục cập nhật trong lúc giao đơn.</Text>{profile?.locationUpdatedAt ? <Text style={styles.hint}>Cập nhật vị trí: {new Date(profile.locationUpdatedAt).toLocaleTimeString("vi-VN")}</Text> : null}</View><PrimaryButton label={online ? "Chuyển sang ngoại tuyến" : "Bật sẵn sàng nhận đơn"} disabled={working || isWorking} onPress={onToggle} />{isWorking ? <Text style={styles.notice}>Bạn không thể ngoại tuyến khi còn đơn được giao.</Text> : null}</ScrollView>; }

function OrderCard({ order, action, working, onPress }: { order: Order; action?: string; working: boolean; onPress?: () => void }) { return <View style={styles.card}><Text style={styles.cardTitle}>#{order._id.slice(-6).toUpperCase()} · {order.orderStatus}</Text><Text style={styles.muted}>{order.restaurantId?.name || "Nhà hàng"}</Text><Text>{order.restaurantId?.address}</Text><Text style={styles.sectionTitle}>Giao đến</Text><Text>{order.shippingAddress.fullName} · {order.shippingAddress.phone}</Text><Text>{[order.shippingAddress.address, order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(", ")}</Text><Text style={styles.sectionTitle}>Món</Text>{order.orderItems.map((item, index) => <Text key={`${item.name}-${index}`}>• {item.name} × {item.quantity}{item.note ? ` · ${item.note}` : ""}</Text>)}<Text style={styles.price}>Tổng COD: {formatVnd(order.totalPrice)}</Text>{action && onPress ? <PrimaryButton label={action} disabled={working} onPress={onPress} /> : null}</View>; }

function BottomNav({ active, onChange, hasDelivery }: { active: "offers" | "delivery" | "account"; onChange: (tab: "offers" | "delivery" | "account") => void; hasDelivery: boolean }) { return <View style={styles.bottomNav}>{([ ["offers", "Đơn gần bạn"], ["delivery", hasDelivery ? "Đơn đang giao" : "Đơn giao"], ["account", "Tài khoản"] ] as const).map(([key, label]) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: active === key }} style={[styles.navItem, active === key && styles.navItemActive]} onPress={() => onChange(key)}><Text style={[styles.navLabel, active === key && styles.navLabelActive]}>{label}</Text></Pressable>)}</View>; }
function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable accessibilityRole="button" style={[styles.primaryButton, disabled && styles.disabled]} disabled={disabled} onPress={onPress}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>; }
function SecondaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable accessibilityRole="button" style={[styles.secondaryButton, disabled && styles.disabled]} disabled={disabled} onPress={onPress}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>; }
function FormField({ label, value, placeholder, keyboardType, secure, onChange }: { label: string; value: string; placeholder: string; keyboardType?: "default" | "email-address" | "phone-pad"; secure?: boolean; onChange: (value: string) => void }) { return <View style={styles.formField}><Text style={styles.fieldLabel}>{label}</Text><TextInput accessibilityLabel={label} style={styles.input} placeholder={placeholder} autoCapitalize={keyboardType === "email-address" || secure ? "none" : "words"} keyboardType={keyboardType} secureTextEntry={secure} value={value} onChangeText={onChange} /></View>; }
function Loading() { return <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>; }
export default function App() { return <QueryClientProvider client={queryClient}><ShipperApp /></QueryClientProvider>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#EFF6FF" }, login: { flex: 1, backgroundColor: "#EFF6FF" }, authForm: { flexGrow: 1, justifyContent: "center", padding: 24, gap: 12 }, formField: { gap: 6 }, fieldLabel: { color: "#1E3A8A", fontWeight: "700" }, header: { minHeight: 64, paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderColor: "#BFDBFE", backgroundColor: "#FFF" }, brand: { color: "#1E40AF", fontSize: 21, fontWeight: "800" }, subtitle: { color: "#475569", fontSize: 16, lineHeight: 24, marginBottom: 8 }, list: { padding: 18, gap: 12, paddingBottom: 100 }, center: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: "#EFF6FF" }, screenTitle: { color: "#1E3A8A", fontSize: 24, fontWeight: "800" }, sectionTitle: { color: "#1E3A8A", fontSize: 15, fontWeight: "800", marginTop: 6 }, cardTitle: { color: "#172554", fontSize: 16, fontWeight: "800" }, muted: { color: "#475569", lineHeight: 20 }, hint: { color: "#64748B", fontSize: 12, lineHeight: 18 }, link: { color: "#2563EB", fontWeight: "800", padding: 10 }, input: { minHeight: 48, borderWidth: 1, borderColor: "#BFDBFE", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#FFF", fontSize: 16 }, primaryButton: { minHeight: 48, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#2563EB", marginTop: 6 }, primaryButtonText: { color: "#FFF", fontWeight: "800", textAlign: "center" }, secondaryButton: { minHeight: 44, borderWidth: 1, borderColor: "#2563EB", alignItems: "center", justifyContent: "center", borderRadius: 10, paddingHorizontal: 12, marginTop: 6 }, secondaryButtonText: { color: "#1D4ED8", fontWeight: "800" }, disabled: { opacity: 0.48 }, error: { color: "#B91C1C", lineHeight: 20 }, emptyText: { textAlign: "center", color: "#64748B", marginTop: 36 }, card: { borderWidth: 1, borderColor: "#BFDBFE", borderRadius: 12, backgroundColor: "#FFF", padding: 14, gap: 5 }, price: { color: "#C2410C", fontWeight: "800", fontSize: 16, marginTop: 6 }, panel: { borderWidth: 1, borderColor: "#BFDBFE", borderRadius: 12, padding: 14, gap: 7, backgroundColor: "#FFF" }, notice: { borderLeftWidth: 4, borderColor: "#EA580C", backgroundColor: "#FFF7ED", color: "#7C2D12", padding: 12, lineHeight: 20 }, map: { height: 280, borderRadius: 12 }, bottomNav: { minHeight: 68, flexDirection: "row", backgroundColor: "#FFF", borderTopWidth: 1, borderColor: "#BFDBFE" }, navItem: { flex: 1, minHeight: 56, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 }, navItemActive: { borderTopWidth: 3, borderColor: "#2563EB" }, navLabel: { color: "#64748B", fontSize: 12, fontWeight: "700", textAlign: "center" }, navLabelActive: { color: "#1D4ED8" },
});
