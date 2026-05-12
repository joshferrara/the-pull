/**
 * Spec section 5.10: "Batched endpoint also supported: POST
 * /api/v1/events/batch accepts an array, for the TUI to flush queued events on
 * quit." This route delegates straight to the single-event handler since it
 * already accepts both an array and a single payload.
 */
import { POST as singleHandler } from "../route";

export const POST = singleHandler;
