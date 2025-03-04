import { Routes, Route } from 'react-router-dom';
import Home from "./Pages/Home";
import PageNotFound from "./Pages/PageNotFound";
import AuthForm from "./Pages/AuthForm";

function App() {
    return (
        <>
           <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<AuthForm />} />
              <Route path="*" element={<PageNotFound />} />
           </Routes>
        </>
     );
}

export default App;
