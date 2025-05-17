import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'

interface Notification {
  _id: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
  isRead: boolean;
  createdAt: string;
}

const typeConfig = {
  info: {
    icon: 'ℹ️',
    borderColor: '#2EC4B6', 
  },
  warning: {
    icon: '⚠️',
    borderColor: '#FF8C42', 
  },
  alert: {
    icon: '🚨',
    borderColor: '#FF4B4B', 
  },
};

const PAGE_SIZE = 20;

const notificationsModal = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch notifications from API (paginated)
  const fetchNotifications = async (pageNum = 0, append = false) => {
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const skip = pageNum * PAGE_SIZE;
      // it's not working todo// fix it 
      const res = await fetch(`/api/notifications?skip=${skip}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      // Sort by createdAt descending
      const sorted = data.sort((a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (append) {
        setNotifications(prev => [...prev, ...sorted]);
      } else {
        setNotifications(sorted);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (err: any) {
      setError(err.message || 'Error fetching notifications');
    } finally {
      if (pageNum === 0) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(0, false);
    setPage(0);
  }, []);

  const markAsRead = async (id: string) => {
    setMarking(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
    } catch (err) {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: false } : n));
      setError('Failed to mark notification as read');
    } finally {
      setMarking(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    setNotifications(prev => prev.map(n => n.isRead ? n : { ...n, isRead: true }));
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to mark all as read');
    } catch (err) {
      setNotifications(prev => prev.map(n => n.isRead ? n : { ...n, isRead: false }));
      setError('Failed to mark all notifications as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const config = typeConfig[item.type];
    return (
      <View
        style={[
          styles.notificationContainer,
          item.isRead ? styles.read : styles.unread,
          { borderLeftColor: config.borderColor, borderLeftWidth: 6 },
        ]}
      >
        <View style={styles.row}>
          <Text style={styles.icon}>{config.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.type}>{item.type.toUpperCase()}</Text>
            <Text style={styles.timestamp}>{
              new Date(item.createdAt).toLocaleString()
            }</Text>
            {!item.isRead && (
              <TouchableOpacity
                style={styles.markReadBtn}
                onPress={() => markAsRead(item._id)}
                disabled={marking === item._id}
              >
                {marking === item._id ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.markReadText}>Mark as Read</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator size="large" color="#FF8C42" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📬 Notifications</Text>
      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
      <TouchableOpacity
        style={[styles.markAllBtn, markingAll && { opacity: 0.7 }]}
        onPress={markAllAsRead}
        disabled={markingAll || notifications.every(n => n.isRead)}
      >
        {markingAll ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.markAllText}>Mark All as Read</Text>
        )}
      </TouchableOpacity>
      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 40 }}>No notifications found.</Text>}
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color="#FF8C42" size="small" />
              ) : (
                <Text style={styles.loadMoreText}>Load More</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  )
}

export default notificationsModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  notificationContainer: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unread: {
    backgroundColor: '#FFF4E6',
  },
  read: {
    backgroundColor: '#F3F4F6',
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  type: {
    fontSize: 12,
    color: '#FF8C42',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  markReadBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FF8C42',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  markReadText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
    marginTop: 2,
  },
  markAllBtn: {
    backgroundColor: '#FF8C42',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  markAllText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loadMoreBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadMoreText: {
    color: '#FF8C42',
    fontWeight: 'bold',
    fontSize: 15,
  },
})