'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useThree } from '@react-three/fiber';
import { gsap } from "gsap";
import { useMousePosition } from 'utils';

const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 h-5 w-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })

export default function Page() {
  const [boards, setBoards] = useState([])
  function createBoards() {
    const boardArray = []
    for (let x = -5; x < 5; x++) {
      for (let y = -5; y < 5; y++) {
        boardArray.push([x, y, 0])
      }
    }
    setBoards(boardArray)
  }

  useEffect(() => {
    createBoards()
    const socket = new WebSocket('ws://localhost:8080');

    socket.addEventListener('open', (event) => {
      console.log('WebSocket connection opened:', event);
    });

    socket.addEventListener('message', (event) => {
      const oscMessage = JSON.parse(event.data);
      console.log('Received OSC message:', oscMessage);
      // Handle the received OSC message in your React component
    });

    socket.addEventListener('close', (event) => {
      console.log('WebSocket connection closed:', event);
    });

    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
    });

    // Cleanup on component unmount
    return () => {
      socket.close();
    };
  }, []);
  return (
    <>
      <View orbit className='relative h-full  w-full'>
        <Common color={'black'} />
        {boards?.map((board, i) => <Board position={board} key={i} />)}
      </View>
    </>
  )
}

function Board(props) {
  const { position } = props
  //const { raycaster } = useThree()
  const { direction } = useMousePosition()
  const [scale] = useState([0.9, 0.9, 0.2])
  const [near, setNear] = useState({ near: false, hover: false })
  const ref = useRef()

  // useEffect(() => {
  //   if (raycaster.params.Points) {
  //     raycaster.params.Points.threshold = 0.1;
  //   }
  // }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (near.near) {
      gsap.to(ref.current.rotation, {
        y: direction === 'right' ? `+=${Math.PI}` : `-=${Math.PI}`,
        ease: "elastic.out",
        delay: 0.03,
        duration: 3,
        onComplete: () => {
          setNear(prev => ({ ...prev, near: false }))
        },
      });
    }
  }, [near.near])
  return (
    <mesh
      ref={ref}
      position={position}
      scale={scale}
      onPointerMove={() => { setNear({ near: true, hover: true }) }}
      onPointerOut={() => { setNear(prev => ({ ...prev, hover: false })) }}
    >
      <boxGeometry />
      <meshStandardMaterial color={near.hover ? "red" : "yellow"} />
    </mesh>
  )
}


