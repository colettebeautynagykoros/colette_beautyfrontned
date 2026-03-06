import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastConfig = () => {
  
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      style={{ zIndex: 99999 }}
      toastStyle={{
        borderRadius: "12px",
        fontFamily: "'Segoe UI', sans-serif",
        boxShadow: "0 8px 24px rgba(214, 62, 120, 0.15)",
      }}
    />
  );
};

export default ToastConfig;