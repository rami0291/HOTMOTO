// The vehicle dictionary (industry/vehicles.ts) in the article analysis: a field of the structure step that names
// the models an article is about (backend/field.ts).
import { defineServerModule } from "@hotmoto/backend/modules";
import { vehiclesField } from "./backend/field.ts";

export default defineServerModule({
  name: "vehicles",
  structure: [vehiclesField],
});
