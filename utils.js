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

export const COLORS = "ff7b00-ff8800-ff9500-ffa200-ffaa00-ffb700-ffc300-ffd000-ffdd00-ffea00".split('-').map(a => '#' + a)

// export const ITP_ARR = [78, 98, 118, 97, 96, 95, 74, 94, 114, 174, 175, 176, 177, 178, 158, 198, 238, 258, 278, 276, 277, 256, 236, 237, 235, 234, 191, 170, 149, 128, 125, 145, 165, 144, 143, 142, 121, 141, 161, 205, 204, 203, 202, 201, 285, 284, 283, 282, 281, 345, 324, 323, 322, 321, 343, 363, 364, 362, 361, 224, 264, 243]
export const ITP_ARR = [82, 103, 124, 102, 101, 100, 78, 99, 120, 166, 187, 208, 186, 185, 184, 183, 250, 249, 248, 247, 246, 271, 292, 291, 290, 269, 201, 179, 157, 135, 132, 153, 174, 152, 151, 150, 128, 149, 170, 216, 215, 214, 213, 212, 236, 256, 278, 300, 299, 298, 297, 296, 363, 341, 340, 339, 338, 361, 383, 382, 381, 380]

export const ITP_SET = new Set(ITP_ARR)

export const Notes = [
    "C5", "D5", "E5", "F5", "G5", "A5", "B5",
    "C6", "D6", "E6", "F6", "G6", "A6", "B6",
]