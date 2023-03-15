import Selecto from 'selecto';
import Moveable from 'moveable';
import {SceneLayoutChild, SceneLayoutChildOptions} from "../../core/types";
import {HorizontalConstraint, VerticalConstraint} from "../../core/canvasTypes";


export function initMoveable(container: HTMLDivElement, targetElements: HTMLElement[], children: SceneLayoutChild[]) {
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
    }).on('dragGroup', (e) => {
        for (let event of e.events) {
            event.target.style.transform = event.transform;
        }
    }).on('resizeStart', (event) => {
        console.log('resize start');
        const targetedElement = findElementByTarget(children, event.target);
        if (targetedElement) {
            // targetedElement.tempConstraint = { ...targetedElement.options.constraint }; // ??
            targetedElement.state.constraint = {
                vertical: VerticalConstraint.Top,
                horizontal: HorizontalConstraint.Left,
            };

            setPlacementFromConstraint(targetedElement);
        }
    }).on('resize', ({ target, width, height }) => {
        target.style.height = `${height}px`;
        target.style.width = `${width}px`;
    });

    let targets: Array<HTMLElement | SVGElement> = [];
    selecto.on('dragStart', (event) => {
        const selectedTarget = event.inputEvent.target;

        const isTargetMoveableElement =
            moveable.isMoveableElement(selectedTarget) ||
            targets.some((target) => target === selectedTarget || target.contains(selectedTarget));

        const isTargetAlreadySelected = selecto
            ?.getSelectedTargets()
            .includes(selectedTarget.parentElement.parentElement);

        if (isTargetMoveableElement || isTargetAlreadySelected || !allowChanges) {
            // Prevent drawing selection box when selected target is a moveable element or already selected
            event.stop();
        }
    })
        .on('selectEnd', (event) => {
            targets = event.selected;
            moveable.target = event.selected;
            if (event.isDragStart) {
                event.inputEvent.preventDefault();
                event.data.timer = setTimeout(() => {
                    moveable!.dragStart(event.inputEvent);
                });
            }
        })
        .on('dragEnd', (event) => {
            clearTimeout(event.data.timer);
        });

function findElementByTarget(elements: SceneLayoutChild[], target: Element) {
    console.log('findElementByTarget');
    const stack = [...elements];
    while (stack.length > 0) {
        const currentElement = stack.shift();

        if (currentElement && currentElement.state.div && currentElement.state.div === target) {
            return currentElement;
        }
    }

    return undefined;
}

// @TODO update and test
function setPlacementFromConstraint(element: SceneLayoutChild, elementContainer?: DOMRect, parentContainer?: DOMRect) {
    const { constraint } = element.state;
    const { vertical, horizontal } = constraint ?? {};

    if (!elementContainer) {
        elementContainer = element.state.div && element.state.div.getBoundingClientRect();
    }
    let parentBorderWidth = 0;
    if (!parentContainer) {
        parentContainer = element.state.div && element.state.div.parentElement?.getBoundingClientRect();
        parentBorderWidth = parseFloat(getComputedStyle(element.state.div?.parentElement!).borderWidth);
    }

    const relativeTop =
        elementContainer && parentContainer
            ? Math.round(elementContainer.top - parentContainer.top - parentBorderWidth)
            : 0;
    const relativeBottom =
        elementContainer && parentContainer
            ? Math.round(parentContainer.bottom - parentBorderWidth - elementContainer.bottom)
            : 0;
    const relativeLeft =
        elementContainer && parentContainer
            ? Math.round(elementContainer.left - parentContainer.left - parentBorderWidth)
            : 0;
    const relativeRight =
        elementContainer && parentContainer
            ? Math.round(parentContainer.right - parentBorderWidth - elementContainer.right)
            : 0;

    const placement = {} as SceneLayoutChildOptions;

    const width = elementContainer?.width ?? 100;
    const height = elementContainer?.height ?? 100;

    switch (vertical) {
        case VerticalConstraint.Top:
            placement.top = relativeTop;
            placement.height = height;
            break;
        case VerticalConstraint.Bottom:
            placement.bottom = relativeBottom;
            placement.height = height;
            break;
        case VerticalConstraint.TopBottom:
            placement.top = relativeTop;
            placement.bottom = relativeBottom;
            break;
        case VerticalConstraint.Center:
            const elementCenter = elementContainer ? relativeTop + height / 2 : 0;
            const parentCenter = parentContainer ? parentContainer.height / 2 : 0;
            const distanceFromCenter = parentCenter - elementCenter;
            placement.top = distanceFromCenter;
            placement.height = height;
            break;
        case VerticalConstraint.Scale:
            placement.top = (relativeTop / (parentContainer?.height ?? height)) * 100;
            placement.bottom = (relativeBottom / (parentContainer?.height ?? height)) * 100;
            break;
    }

    switch (horizontal) {
        case HorizontalConstraint.Left:
            placement.left = relativeLeft;
            placement.width = width;
            break;
        case HorizontalConstraint.Right:
            placement.right = relativeRight;
            placement.width = width;
            break;
        case HorizontalConstraint.LeftRight:
            placement.left = relativeLeft;
            placement.right = relativeRight;
            break;
        case HorizontalConstraint.Center:
            const elementCenter = elementContainer ? relativeLeft + width / 2 : 0;
            const parentCenter = parentContainer ? parentContainer.width / 2 : 0;
            const distanceFromCenter = parentCenter - elementCenter;
            placement.left = distanceFromCenter;
            placement.width = width;
            break;
        case HorizontalConstraint.Scale:
            placement.left = (relativeLeft / (parentContainer?.width ?? width)) * 100;
            placement.right = (relativeRight / (parentContainer?.width ?? width)) * 100;
            break;
    }

    element.setState({...element.state, placement}); // ???

    // this.options.placement = placement;
    // this.applyLayoutStylesToDiv();
    // this.revId++;
    //
    // this.getScene()?.save();
}

  return { selecto, moveable };
}
