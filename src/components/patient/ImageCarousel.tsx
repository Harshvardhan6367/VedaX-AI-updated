import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const IMAGES = [
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1200&auto=format&fit=crop', // Medical tech
    'https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=1200&auto=format&fit=crop', // Doctor with patient
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=1200&auto=format&fit=crop', // Health wellness
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=1200&auto=format&fit=crop'  // Hospital corridor
];

const ImageCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const next = () => setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + IMAGES.length) % IMAGES.length);

    return (
        <div className="relative w-full h-48 md:h-64 lg:h-80 rounded-[2.5rem] overflow-hidden mb-8 group shadow-xl shadow-blue-900/10">
            {IMAGES.map((img, idx) => (
                <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                    {/* Overlay Text */}
                    <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12 text-white">
                        <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2 drop-shadow-md">
                            {idx === 0 && 'Advanced Medical Technology'}
                            {idx === 1 && 'Expert Consultations'}
                            {idx === 2 && 'Holistic Health & Wellness'}
                            {idx === 3 && 'World-Class Facilities'}
                        </h2>
                        <p className="text-sm md:text-base font-medium opacity-90 max-w-lg drop-shadow">
                            Connecting you with the best healthcare solutions seamlessly through Swasthya Setu.
                        </p>
                    </div>
                </div>
            ))}

            {/* Controls */}
            <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 p-2.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 p-2.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
                <ChevronRight size={24} />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                {IMAGES.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-2 rounded-full transition-all duration-500 shadow-sm ${idx === currentIndex ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/80 w-2'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ImageCarousel;
