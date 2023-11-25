import React from 'react';
export const useMousePosition = () => {
    const [
        mousePosition,
        setMousePosition
    ] = React.useState({ px: 0, py: 0, x: null, y: null, direction: null });
    React.useEffect(() => {
        const updateMousePosition = ev => {
            let direction
            let movementX = Math.abs(ev.movementX)
            let movementY = Math.abs(ev.movementY)
            let movement = movementX > movementY ? movementX * 5 : movementY * 5
            //console.log(ev.movementX, ev.movementY)
            //console.log(movement)
            if (ev.movementX > 0 || ev.movementY > 0) {
                direction = 'right'
            } else if (ev.movementX < 0 || ev.movementY < 0) {
                direction = 'left'
            }
            setMousePosition(prev => ({
                ...prev,
                x: ev.clientX,
                y: ev.clientY,
                direction,
                movement
            }))
        };
        window.addEventListener('mousemove', updateMousePosition);
        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
        };
    }, []);
    return mousePosition;
};