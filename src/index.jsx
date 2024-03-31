import './style.css'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useState } from 'react'
import { Button } from '@mui/material'
import GlobalStates from './r3f-gist/utility/GlobalStates'

function Overlay() {
    const [clicked, setClicked] = useState(false)

    return (
        <>
            <GlobalStates />
            {clicked && <App />}
            <div className="container" style={{ cursor: clicked ? "none" : "auto" }}>
                <div className={`fullscreen bg ready ${clicked ? "clicked" : ""}`}>
                    <Button
                        className={clicked ? "unselectable" : ""} onClick={() => setClicked(true)}
                        variant="outlined"
                    >
                        Play
                    </Button>
                </div>
            </div>
        </>
    )
}

createRoot(document.querySelector('#root')).render(<Overlay />)