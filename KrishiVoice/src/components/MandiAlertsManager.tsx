import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { mockMandiPrices } from '../mock/mandiPrices';

export default function MandiAlertsManager() {
  useEffect(() => {
    const triggerAlert = () => {
      try {
        const saved = localStorage.getItem('krishi_notifications');
        const notifications = saved ? JSON.parse(saved) : { buyer: true, mandi: false, status: true };
        
        if (notifications.mandi) {
          const randomCrop = mockMandiPrices[Math.floor(Math.random() * mockMandiPrices.length)];
          const msg = `Mandi Alert: ${randomCrop.cropHindi || randomCrop.crop} price is ₹${randomCrop.price}/${randomCrop.unit} in ${randomCrop.mandi} (Real-time)`;
          
          toast(msg, { icon: '📢', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
          
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("KrishiVoice Mandi Alert", { body: msg, icon: '/favicon.ico' });
          }
        }
      } catch (e) {
        console.error("MandiAlertManager error", e);
      }
    };

    // Run every 15 seconds to simulate real-time updates without being too overwhelming
    const interval = setInterval(triggerAlert, 15000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
