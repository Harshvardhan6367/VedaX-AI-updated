import React, { useState } from 'react';
import { Star, X, MessageSquare, Award, Heart } from 'lucide-react';
import { Appointment } from '@/types';
import { Button, Card, Badge } from '@/components/shared/ui';

interface RateDoctorModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSubmit: (appointmentId: string, rating: number, review: string) => void;
}

const RateDoctorModal: React.FC<RateDoctorModalProps> = ({ appointment, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(appointment.id, rating, review);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-500 font-sans">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      ></div>

      <Card className="w-full max-w-sm p-8 relative animate-in zoom-in-95 duration-500 shadow-2xl border-white/20 dark:border-slate-800/50 overflow-hidden">

        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors group"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 transform -rotate-3">
              <Award size={40} className="text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 p-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-800">
              <Heart size={16} className="text-rose-500 fill-rose-500" />
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight">Rate Your Experience</h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold tracking-tight">
              Tell us about your session with <br />
              <span className="text-blue-600 dark:text-blue-400 font-black italic">{appointment.doctorName}</span>
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="group relative transition-transform hover:scale-125 focus:outline-none"
              >
                {(hoverRating || rating) >= star && (
                  <div className="absolute inset-0 bg-amber-400 blur-lg opacity-40 animate-pulse"></div>
                )}
                <Star
                  size={36}
                  className={`relative transition-all duration-300 ${(hoverRating || rating) >= star
                      ? 'text-amber-400 fill-amber-400 scale-110'
                      : 'text-slate-200 dark:text-slate-800'
                    }`}
                />
              </button>
            ))}
          </div>

          <div className="w-full mb-8 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <MessageSquare size={12} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Your Feedback</span>
            </div>
            <textarea
              placeholder="Write a quick review..."
              className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none resize-none h-28 text-slate-900 dark:text-white transition-all placeholder:text-slate-400 font-medium"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-[0.97]"
          >
            Submit Review
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default RateDoctorModal;
