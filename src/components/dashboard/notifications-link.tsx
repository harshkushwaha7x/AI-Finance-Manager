"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subscribeToNotificationsChanged } from "@/lib/utils/notification-events";

type NotificationsLinkResponse = {
  summary?: {
    unreadCount: number;
  };
};

export function NotificationsLink() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
        });
        const payload = (await response.json()) as NotificationsLinkResponse;

        if (isMounted) {
          setUnreadCount(payload.summary?.unreadCount ?? 0);
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    }

    void loadUnreadCount();

    const unsubscribe = subscribeToNotificationsChanged(() => {
      void loadUnreadCount();
    });

    const handleFocus = () => {
      void loadUnreadCount();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <Button asChild variant="secondary" className="justify-start gap-2">
      <Link href="/dashboard/notifications">
        <Bell className="h-4 w-4" />
        Notifications
        {unreadCount ? <Badge variant="warning">{unreadCount}</Badge> : null}
      </Link>
    </Button>
  );
}
