import { useEffect } from "react";

const Notification = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-5 right-5 bg-[#3393D4] text-white px-4 py-3 rounded-lg shadow-lg z-[9999] animate-slide-in">
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default Notification;