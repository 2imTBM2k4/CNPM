import React from 'react'
import './AppDownload.css'
import { assets } from '../../assets/assets'

const AppDownload = () => {
  return (
    <div className='app-download' id='app-download'>
        <p className='pforbetter'>For Better Experience Download <br /> Drone Delivery App</p>
        <div className="app-download-platforms">
            <img src={assets.play_store} alt="Get it on Google Play" />
            <img src={assets.app_store} alt="Download on the App Store" />
        </div>
    </div>
  )
}

export default AppDownload