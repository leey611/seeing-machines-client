'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, Suspense } from 'react'

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
  const [scale] = useState([0.8, 0.8, 0.2])
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry />
      {/* <meshStandardMaterial /> */}
      <meshNormalMaterial />
    </mesh>
  )
}


