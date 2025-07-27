import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { MessageSquare, Send, Paperclip, Download, FileText, Image as ImageIcon, Search, MoreVertical, Trash2, User, Building2 } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherParticipant, setOtherParticipant] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle URL parameters for starting new conversations
  useEffect(() => {
    const projectId = searchParams.get("projectId");
    const recipientId = searchParams.get("recipientId");

    console.log("URL params:", { projectId, recipientId });

    if (projectId && recipientId && recipientId !== "undefined" && recipientId !== "null") {
      // Find existing conversation or create new one
      const existingConversation = conversations.find((conv) => conv.project?._id === projectId && conv.otherParticipant._id === recipientId);

      if (existingConversation) {
        console.log("Found existing conversation:", existingConversation);
        setSelectedConversation(existingConversation);
      } else {
        console.log("Creating new conversation for:", { recipientId, projectId });
        // Fetch recipient details and create a temporary conversation
        fetchRecipientDetails(recipientId, projectId);
      }
    }
  }, [searchParams, conversations]);

  const fetchRecipientDetails = async (recipientId, projectId) => {
    try {
      // Check if recipientId is valid
      if (!recipientId || recipientId === "undefined" || recipientId === "null") {
        toast.error("Invalid recipient ID");
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/users/${recipientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const tempConversation = {
        conversationId: `temp-${Date.now()}`,
        project: { _id: projectId },
        otherParticipant: response.data.user,
      };
      setSelectedConversation(tempConversation);
      setOtherParticipant(response.data.user); // Set the otherParticipant state
    } catch (error) {
      console.error("Error fetching recipient details:", error);
      toast.error("Failed to load recipient details");
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      console.log("selectedConversation changed:", selectedConversation);

      // Set the otherParticipant from the selected conversation
      if (selectedConversation.otherParticipant) {
        console.log("Setting otherParticipant:", selectedConversation.otherParticipant);
        setOtherParticipant(selectedConversation.otherParticipant);
      }

      // Fetch messages for existing conversations
      if (!selectedConversation.conversationId.startsWith("temp-")) {
        fetchMessages(selectedConversation.conversationId);
      }
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/messages/conversations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setConversations(response.data.conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      // Don't fetch messages for temporary conversations
      if (conversationId.startsWith("temp-")) {
        setMessages([]);
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/messages/conversation/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setMessages(response.data.messages);
      // otherParticipant is now set in the useEffect when selectedConversation changes
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const sendMessage = async () => {
    console.log("sendMessage called:", {
      newMessage: newMessage.trim(),
      selectedConversation,
      otherParticipant,
      hasOtherParticipantId: !!otherParticipant?._id,
    });

    if (!newMessage.trim() || !selectedConversation || !otherParticipant?._id) {
      console.log("sendMessage blocked:", {
        hasMessage: !!newMessage.trim(),
        hasConversation: !!selectedConversation,
        hasParticipantId: !!otherParticipant?._id,
      });
      return;
    }

    try {
      setSending(true);
      const formData = new FormData();
      formData.append("recipientId", otherParticipant._id);
      formData.append("content", newMessage.trim());
      if (selectedConversation.project && selectedConversation.project._id) {
        formData.append("projectId", selectedConversation.project._id);
      }

      const response = await axios.post("http://localhost:5000/api/messages/send", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Add the new message to the current conversation
      setMessages([...messages, response.data.message]);
      setNewMessage("");

      // Update conversation list with new message
      fetchConversations();

      // If this was a new conversation, update the selected conversation
      if (selectedConversation.conversationId.startsWith("temp-")) {
        const newConversationId = response.data.message.conversationId;
        setSelectedConversation((prev) => ({
          ...prev,
          conversationId: newConversationId,
        }));
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getParticipantName = (participant) => {
    if (!participant) return "Unknown User";
    return `${participant.firstName} ${participant.lastName}`;
  };

  const getParticipantInitials = (participant) => {
    if (!participant) return "U";
    return `${participant.firstName?.charAt(0) || "U"}${participant.lastName?.charAt(0) || "S"}`;
  };

  const filteredConversations = conversations.filter((conv) => getParticipantName(conv.otherParticipant).toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <button onClick={() => setShowNewMessageForm(true)} className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              <MessageSquare className="w-4 h-4 mr-1" />
              New
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a conversation by messaging someone</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.conversationId}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.conversationId === conversation.conversationId ? "bg-blue-50 border-blue-200" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{getParticipantInitials(conversation.otherParticipant)}</span>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{conversation.unreadCount}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{getParticipantName(conversation.otherParticipant)}</h3>
                      <span className="text-xs text-gray-500">{formatTime(conversation.lastMessage.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conversation.lastMessage.content}</p>
                    {conversation.project && (
                      <div className="flex items-center mt-1">
                        <Building2 className="w-3 h-3 text-gray-400 mr-1" />
                        <span className="text-xs text-gray-500 truncate">{conversation.project.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{getParticipantInitials(otherParticipant)}</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">{getParticipantName(otherParticipant)}</h2>
                    <p className="text-sm text-gray-500">{otherParticipant?.role === "project_owner" ? "Project Owner" : "Service Provider"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message._id} className={`flex ${message.sender._id === user._id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender._id === user._id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}>
                    {message.type === "file" && message.attachment && (
                      <div className="mb-2">
                        <div className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{message.attachment.originalName}</span>
                          <button onClick={() => window.open(`http://localhost:5000/${message.attachment.path}`, "_blank")} className="text-blue-200 hover:text-white">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.sender._id === user._id ? "text-blue-200" : "text-gray-500"}`}>{formatTime(message.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="1"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
