import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './Components/App';
import Header from './Components/Header';
import Loading from './Components/Loading';
import Body from './Components/Body';
import './css/index.css';
import './css/Header.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <Loading />
            <Header />
            <Body>
                <App />
            </Body>
        </BrowserRouter>
    </React.StrictMode>
);
