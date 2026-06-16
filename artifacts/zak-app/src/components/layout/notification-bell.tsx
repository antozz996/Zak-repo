import { useQueryClient } from "@tanstack/react-query";
import { Bell, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import {
  getGetUnreadNotificationsQueryKey,
  useGetUnreadNotifications,
  useMarkNotificationRead,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function NotificationBell() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useGetUnreadNotifications({
    query: {
      queryKey: getGetUnreadNotificationsQueryKey(),
      refetchInterval: 30_000,
    },
  });
  const markRead = useMarkNotificationRead();

  const handleOpenNotification = async (id: string, link?: string | null) => {
    await markRead.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationsQueryKey() });
    if (link) {
      navigate(link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {notifications.length > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="border-b px-4 py-3">
          <p className="font-semibold">Notifiche</p>
          <p className="text-xs text-muted-foreground">Aggiornamento automatico ogni 30 secondi.</p>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Caricamento...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nessuna notifica non letta.
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-accent"
                  onClick={() => void handleOpenNotification(notification.id, notification.link)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {notification.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
