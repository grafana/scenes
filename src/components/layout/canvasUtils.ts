import Selecto from "selecto";
import Moveable from "moveable";

export function initMoveable(container: HTMLDivElement, targetElements: HTMLElement[]) {
    const allowChanges = true;

    const selecto = new Selecto({
        container: container,
        rootContainer: container,
        selectableTargets: targetElements,
        toggleContinueSelect: 'shift',
        selectFromInside: false,
        hitRate: 0,
    });

    const moveable = new Moveable(container, {
        draggable: allowChanges,
        resizable: allowChanges,
        origin: false,
    }).on('drag', (event) => {
        event.target.style.transform = event.transform;
    }).on('resize', (event) => {
    });

    selecto.on('selectEnd', (event) => {
        moveable!.target = event.selected;
        if (event.isDragStart) {
            event.inputEvent.preventDefault();
            event.data.timer = setTimeout(() => {
                moveable!.dragStart(event.inputEvent);
            });
        }
    }).on('dragEnd', (event) => {
        clearTimeout(event.data.timer);
    });

    return { selecto, moveable};
}
