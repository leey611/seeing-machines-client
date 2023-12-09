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

export const COLORS = "9b5de5-f15bb5-fee440-00bbf9-00f5d4".split('-').map(a => '#' + a)

export const ITP_ARR = [75, 95, 115, 94, 93, 92, 72, 112, 155, 175, 195, 174, 173, 172, 235, 234, 233, 232, 255, 275, 274, 273, 253, 169, 148, 127, 106, 144, 164, 184, 163, 162, 141, 161, 181, 224, 223, 222, 221, 243, 263, 284, 283, 282, 281, 344, 323, 322, 321, 342, 363, 362, 361]

export const ITP_SET = new Set(ITP_ARR)

export const Notes = [
    "C5", "D5", "E5", "F5", "G5", "A5", "B5",
    "C6", "D6", "E6", "F6", "G6", "A6", "B6",
]