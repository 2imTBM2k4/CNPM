import React, { useState } from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'

const Home = () => {
    const [category, setCategory] = useState("All");
    
    return (
        <div>
            <Header/>
            {/* Best Seller Section */}
            <div className="home-section">
                <h2>Best Choice Food</h2>
                <FoodDisplay category={category} />
            </div>
            
            {/* Best Choice Restaurants Section - Có thể thêm sau */}
            <div className="home-section">
                <h2>Best Choice Restaurants</h2>
                {/* Component restaurants sẽ thêm sau */}
                <p style={{textAlign: 'center', padding: '40px'}}>Restaurant section coming soon...</p>
            </div>
            
            <AppDownload/>
        </div>
    )
}

export default Home