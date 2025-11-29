import React, { useEffect } from 'react';

declare global {
    interface Window {
        adsbygoogle: any[];
    }
}

interface AdBannerProps {
    className?: string;
    slotId?: string; // Optional: specific ad slot ID if you create ad units in AdSense console
}

const AdBanner: React.FC<AdBannerProps> = ({ className, slotId = "1234567890" }) => {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (err) {
            console.error('AdSense error:', err);
        }
    }, []);

    return (
        <div className={`w-full overflow-hidden ${className}`}>
            <div className="text-[10px] text-gray-500 text-center uppercase tracking-widest mb-1">Advertisement</div>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-7181190966157972"
                data-ad-slot={slotId}
                data-ad-format="auto"
                data-full-width-responsive="true"
            />
        </div>
    );
};

export default AdBanner;
