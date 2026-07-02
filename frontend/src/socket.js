import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";

// Single shared socket instance for the whole app. autoConnect is false
// so we can connect only once the user has "logged in" with a username.
export const socket = io(API_BASE_URL, {
  autoConnect: false,
});
