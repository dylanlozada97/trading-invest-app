import { useState, useEffect, useCallback, useRef } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { loadUser, AppUser } from "@/lib/auth-store";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function ChatScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadUser().then((u) => {
      if (u) setUser(u);
      else router.replace("/welcome");
    });
  }, []);

  const messagesQuery = trpc.investment.getChatMessages.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user?.id && user.id > 0, refetchInterval: 5000 }
  );

  const sendMutation = trpc.investment.sendChatMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      setSending(false);
      messagesQuery.refetch();
    },
    onError: () => setSending(false),
  });

  const markReadMutation = trpc.investment.markChatRead.useMutation();

  // Mark messages as read when opening chat
  useEffect(() => {
    if (user?.id) {
      markReadMutation.mutate({ userId: user.id });
    }
  }, [user?.id, messagesQuery.data?.length]);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messagesQuery.data?.length]);

  const handleSend = () => {
    if (!message.trim() || !user?.id || sending) return;
    setSending(true);
    sendMutation.mutate({ userId: user.id, message: message.trim() });
  };

  const messages = messagesQuery.data || [];

  const formatTime = (dateStr: string | Date) => {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${h}:${mins} ${ampm}`;
  };

  const formatDate = (dateStr: string | Date) => {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Hoy";
    if (d.toDateString() === yesterday.toDateString()) return "Ayer";
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  };

  // Group messages by date
  const groupedMessages: { date: string | Date; msgs: typeof messages }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groupedMessages.push({ date: msg.createdAt, msgs: [] });
    }
    groupedMessages[groupedMessages.length - 1].msgs.push(msg);
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{"‹"}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.adminAvatar}>
              <Text style={styles.adminAvatarText}>S</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Soporte</Text>
              <Text style={styles.headerSubtitle}>En línea</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && !messagesQuery.isLoading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Bienvenido al chat de soporte</Text>
              <Text style={styles.emptyText}>
                Escribe tu mensaje y te responderemos lo antes posible.
              </Text>
            </View>
          )}

          {messagesQuery.isLoading && (
            <View style={styles.emptyState}>
              <ActivityIndicator color="#DC2626" size="large" />
              <Text style={styles.emptyText}>Cargando mensajes...</Text>
            </View>
          )}

          {groupedMessages.map((group, gi) => (
            <View key={gi}>
              <View style={styles.dateSeparator}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>{formatDate(group.date)}</Text>
                <View style={styles.dateLine} />
              </View>
              {group.msgs.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.senderType === "user" ? styles.userBubble : styles.adminBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      msg.senderType === "user" ? styles.userText : styles.adminText,
                    ]}
                  >
                    {msg.message}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      msg.senderType === "user" ? styles.userTime : styles.adminTime,
                    ]}
                  >
                    {formatTime(msg.createdAt)}
                    {msg.senderType === "user" && (
                      msg.isRead ? " ✓✓" : " ✓"
                    )}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#687076"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!message.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#16213e",
    borderBottomWidth: 1,
    borderBottomColor: "#1a2a4a",
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  backText: { fontSize: 32, color: "#DC2626", fontWeight: "600", marginTop: -4 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  adminAvatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  headerTitle: { color: "#ECEDEE", fontWeight: "bold", fontSize: 16 },
  headerSubtitle: { color: "#4ADE80", fontSize: 12 },
  messagesContainer: { flex: 1, backgroundColor: "#0a1628" },
  messagesContent: { padding: 16, paddingBottom: 8 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: "#ECEDEE", fontSize: 18, fontWeight: "bold" },
  emptyText: { color: "#9BA1A6", fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 8,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: "#1a2a4a" },
  dateText: { color: "#687076", fontSize: 12 },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DC2626",
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#1e2d4d",
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  userText: { color: "#fff" },
  adminText: { color: "#ECEDEE" },
  messageTime: { fontSize: 11, marginTop: 4 },
  userTime: { color: "rgba(255,255,255,0.6)", textAlign: "right" },
  adminTime: { color: "#687076" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#16213e",
    borderTopWidth: 1,
    borderTopColor: "#1a2a4a",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#0d1b36",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#ECEDEE",
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#1a2a4a",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#4a1010", opacity: 0.5 },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});
