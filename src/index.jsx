import './style.css'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useState } from 'react'

function Overlay() {
    const [clicked, setClicked] = useState(true)
    return (
        <>
            {clicked && <App />}
            <div className="container" style={{ cursor: clicked ? "none" : "auto" }}>
                <div className={`fullscreen bg ready ${clicked ? "clicked" : ""}`}>
                    <p className={clicked ? "unselectable" : ""} onClick={() => setClicked(true)}>
                        {"Play"}
                    </p>
                </div>
            </div>
        </>
    )
}

createRoot(document.querySelector('#root')).render(<Overlay />)