import React from 'react';
import { X, Bell, Calendar, Activity, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Notification } from '@/types';
import { Button, Badge } from '@/components/shared/ui';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose, notifications }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={onClose}
      ></div>

      <div className="w-[380px] h-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl relative animate-in slide-in-from-right duration-500 flex flex-col border-l border-white/20 dark:border-slate-800/50 shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-transparent">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-xl p-2.5 shadow-lg shadow-blue-500/20">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tighter">
                Notifications
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Stay Updated</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors group"
          >
            <X size={20} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </button>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60%] text-center p-8 space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300">
                <Bell size={32} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Recent Events</label>
              <div className="space-y-2">
                {notifications.map((notif, index) => (
                  <div
                    key={notif.id}
                    className={`relative p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.01] overflow-hidden group ${notif.read
                        ? 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-70'
                        : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md'
                      }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {!notif.read && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                    )}

                    <div className="flex gap-4">
                      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'alert'
                          ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20'
                          : notif.type === 'reminder'
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20'
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                        }`}>
                        {notif.type === 'alert' ? <AlertCircle size={20} /> : notif.type === 'reminder' ? <Calendar size={20} /> : <Info size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Overlay */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm">
          <Button
            variant="secondary"
            className="w-full text-[10px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-black uppercase tracking-widest"
            icon={CheckCircle2}
          >
            Mark all as read
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;