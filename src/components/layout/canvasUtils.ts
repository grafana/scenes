import Selecto from "selecto";
import Moveable from "moveable";

export function initMoveable(container: any, targetElements: HTMLElement[]) {
    const allowChanges = true;

    // @TODO styling
    const selecto = new Selecto({
        container: container,
        rootContainer: container,
        selectableTargets: targetElements,
        toggleContinueSelect: 'shift',
        selectFromInside: false,
        hitRate: 0,
    });

    // @TODO make it work with other constraints
    const moveable = new Moveable(container, {
        draggable: allowChanges,
        resizable: allowChanges,
        origin: false,
    }).on('drag', (event) => {
        event.target.style.transform = event.transform;
    });

    selecto.on('select', (e) => {
        // @TODO revisit after Moveable is fully functional
        e.added.forEach((el) => el.classList.add('selecto-selected'));
        e.removed.forEach((el) => el.classList.remove('selecto-selected'));
    }).on('selectEnd', (event) => {
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
