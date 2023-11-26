'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from "gsap";
import { useMousePosition } from 'utils';
import { MathUtils, Vector3 } from 'three';

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
  const [boards, setBoards] = useState([]);

  // Game state
  const [isCompleted, setIsCompleted] = useState(false);
  const [amountOfTilesCompleted, setAmountOfTilesCompleted] = useState(0);
  console.log(amountOfTilesCompleted)
  function createBoards() {
    const boardArray = []
    for (let x = -10; x < 10; x++) {
      for (let y = -10; y < 10; y++) {
        boardArray.push([x, y, 0])
      }
    }
    setBoards(boardArray)
  }

  const fetchData = async () => {
    const response = await fetch("/");
    const jsonData = await response.json();
    // setState here!
  }

  useEffect(() => {

    // if (amountOfTilesCompleted === amountofRedTiles) setIsCompleted(true);
  }, [amountOfTilesCompleted]);

  useEffect(() => {
    createBoards()
    const socket = new WebSocket('ws://localhost:8080');

    // fetchData()
    // fetch gives us the first promise
    // response in fetch.json() gives us a second promise

    // const data = fetch("/")
    //   .then(res => {
    //     // This is a 2nd promise
    //     res.json().then(d => console.log(d))
    //   });

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
        {boards?.map((board, i) => <Board onComplete={setAmountOfTilesCompleted} position={board} key={i} />)}
        <Walker />
      </View>
    </>
  )
}

const rotationTimeMap = (movement) => {
  let level = { count: 1, duration: 4 }
  if (movement < 100) {
    level = { count: 1, duration: 4 }
  } else if (movement >= 100 && movement < 300) {
    level = { count: 2, duration: 3 }
  } else if (movement > 300) {
    level = { count: 3, duration: 3.5 }
  }
  return level
}

function Board(props) {
  const { position, onComplete } = props
  //console.log('mouse', mouse)
  const { direction, movement } = useMousePosition()
  const { count, duration } = rotationTimeMap(movement)//rotationTransformer(movement)

  //console.log(movement, rotationTimeMap(movement))
  const [scale] = useState([0.9, 0.9, 0.2])
  const [near, setNear] = useState({ near: false, hover: false })
  const ref = useRef()

  useEffect(() => {
    if (!ref.current) return;
    if (near.near) {
      gsap.to(ref.current.rotation, {
        y: direction === 'right' ? `+=${count * Math.PI}` : `-=${count * Math.PI}`,
        ease: "elastic.out",
        delay: 0.03,
        // stagger: 2,
        duration,
        onComplete: () => {
          setNear(prev => ({ ...prev, near: false }))

          // If this is a red tile (i.e a tile that needs to be flipped in order to win) -> then we increment!
          //onComplete(value => value + 1);
        },
      });
    }
  }, [near.near])
  return (
    <mesh
      ref={ref}
      position={position}
      scale={scale}
      onPointerEnter={() => { setNear({ near: true, hover: true }) }}
      onPointerOut={() => { setNear(prev => ({ ...prev, hover: false })) }}
    >
      <boxGeometry />
      <meshStandardMaterial color={near.hover ? "red" : "yellow"} />
    </mesh>
  )
}

function generateRandomPosition() {
  return new Vector3(
    MathUtils.randFloat(-10, 10),
    MathUtils.randFloat(-10, 10),
    0 // Fixed z-axis at 0
  );
}

function Walker(props) {
  const walkerRef = useRef();
  const [targetPosition, setTargetPosition] = useState(generateRandomPosition());
  const [lerpFactor, setLerpFactor] = useState(0);

  useFrame(() => {
    // Increment lerp factor
    setLerpFactor((prevFactor) => Math.min(prevFactor + 0.01, 1));

    // Lerp towards the target position
    const newPosition = new Vector3().lerpVectors(
      walkerRef.current.position,
      targetPosition,
      lerpFactor
    );

    // Update sphere position
    walkerRef.current.position.copy(newPosition);

    // If lerp is complete, generate a new random target position
    if (lerpFactor === 1) {
      setTargetPosition(generateRandomPosition());
      setLerpFactor(0);
    }
  });

  return (
    <mesh ref={walkerRef} position={walkerRef.current ? walkerRef.current.position : [0, 0, 0]} scale={[0.5, 0.5, 0.5]}>
      <sphereGeometry />
      <meshNormalMaterial />
    </mesh>
  );
}


