import { Drawing } from "../ui/Graphic";

/**
 * The drafting table under every page: the survey map across the window and the motorcycle's side
 * elevation in its lower right, in the light grey of the backdrop. Fixed, so pages scroll over it; cards
 * and bars are opaque and cover it, open ground shows it.
 */
export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Drawing of="map" fit="cover" className="absolute inset-0" />
      <Drawing of="moto" at="right bottom" className="absolute bottom-[-3vh] right-[-2vw] aspect-[2400/1560] w-[min(1180px,92vw)] lg:w-[min(1180px,64vw)]" />
    </div>
  );
}
