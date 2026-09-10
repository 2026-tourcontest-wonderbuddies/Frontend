import { authHandlers } from "./handlers/auth";
import { tripHandlers } from "./handlers/trips";
import { candidateHandlers } from "./handlers/candidates";
import { savedHandlers } from "./handlers/saved";
import { editHandlers } from "./handlers/edit";
import { chatHandlers } from "./handlers/chat";
import { searchHandlers } from "./handlers/search";
import { lodgingHandlers } from "./handlers/lodging";

export const handlers = [
  ...authHandlers,
  ...tripHandlers,
  ...candidateHandlers,
  ...savedHandlers,
  ...editHandlers,
  ...chatHandlers,
  ...searchHandlers,
  ...lodgingHandlers,
];
