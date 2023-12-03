'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, forwardRef, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber';
import { gsap } from "gsap";
import { Vector3 } from 'three';

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
  const [deletables, setDeletables] = useState([])
  const [gesture, setGesture] = useState("move")
  const walkerRef = useRef()
  // Game state
  const [isCompleted, setIsCompleted] = useState(false);
  const [amountOfTilesCompleted, setAmountOfTilesCompleted] = useState(0);
  console.log(amountOfTilesCompleted)
  function createBoards() {
    const boardArray = []
    const deletables = []
    for (let x = -10; x < 10; x++) {
      for (let y = -10; y < 10; y++) {
        boardArray.push([x, y, 0])
        deletables.push(Math.random() > 0.5)
      }
    }
    setBoards(boardArray)
    setDeletables(deletables)
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
      //console.log('Received OSC message:', oscMessage);
      if (!walkerRef.current) return
      if (oscMessage.address === '/position') {
        const [xPos, yPos, xVelocity, yVelocity] = oscMessage.args
        walkerRef.current.position.x = xPos
        walkerRef.current.position.y = yPos
        if (Math.abs(xVelocity) > Math.abs(yVelocity)) {
          walkerRef.current.direction = xVelocity > 0 ? 'right' : 'left'
          walkerRef.current.speed = xVelocity
          walkerRef.current.absSpeed = Math.abs(xVelocity)
        } else {
          walkerRef.current.direction = yVelocity > 0 ? 'down' : 'up'
          walkerRef.current.speed = yVelocity
          walkerRef.current.absSpeed = Math.abs(yVelocity)
        }


        setGesture("move")
      }

      if (oscMessage.address === '/click') {
        console.log('click', walkerRef.current.selectedCount)
        // if 0 boards has been selected, enable to select
        if (!walkerRef.current.selectedCount) {
          console.log('init select')
          const selectedPosition = new Vector3()
          selectedPosition.copy(walkerRef.current.position);
          walkerRef.current.selectPosition = selectedPosition
          setGesture("click")
        }
      }

      if (oscMessage.address === '/shoot') {
        console.log('shoot', walkerRef.current.selectedCount)
        // if 1 board is selected, either change its color or hide it
        if (walkerRef.current.selectedCount) {
          setGesture("shoot") // change the state
        }

      }

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
        {boards?.map((board, i) => <Board
          onComplete={setAmountOfTilesCompleted}
          position={board}
          key={i}
          ref={walkerRef}
          gesture={gesture}
          deletable={deletables[i]}
        />)}
        <Walker ref={walkerRef} />
      </View>
    </>
  )
}

const mapSpeedRotation = (speed) => {
  //console.log('speed', speed)
  let level = { count: 1, ducation: 4 }
  if (speed < 100) {
    level = { count: 1, duration: 5 }
  } else if (speed >= 300 && speed < 600) {
    level = { count: 2, duration: 5 }
  } else if (speed > 600) {
    level = { count: 3, duration: 4.5 }
  }
  return level
}

const Board = forwardRef(function (props, walkerRef) {
  const { position, deletable, onComplete, gesture } = props

  const [scale] = useState([0.9, 0.9, 0.2])
  const [color, setColor] = useState(deletable ? '#4d1782' : 'white')
  const [isSelected, setIsSelected] = useState(false)
  const [visible, setVisible] = useState(true)
  const [near, setNear] = useState({ near: false, hover: false })
  const ref = useRef()

  useEffect(() => {
    if (visible) {
      if (gesture === 'click' && !walkerRef.current.selectedCount) {
        const boardVec = new Vector3(ref.current.position.x, ref.current.position.y, ref.current.position.z)
        if (boardVec.distanceTo(walkerRef.current.selectPosition) < 0.5) {
          setColor("red")
          setIsSelected(true)
          walkerRef.current.selectedCount = 1
          walkerRef.current.selectPosition = null
        }
      }

      if (isSelected && gesture === 'shoot') {
        deletable ? setVisible(false) : setColor('blue')
        setIsSelected(false)
        walkerRef.current.selectedCount = 0
      }

    }

  }, [gesture])

  useFrame(() => {
    const boardVec = new Vector3(ref.current.position.x, ref.current.position.y, ref.current.position.z)
    const walkerVec = new Vector3(walkerRef.current.position.x, walkerRef.current.position.y, walkerRef.current.position.z)
    const distance = walkerVec.distanceTo(boardVec)
    if (distance < 0.5) {
      setNear({ near: true, hover: true })
    } else {
      setNear(prev => ({ ...prev, hover: false }))
    }
  })

  useEffect(() => {
    if (!ref.current) return;
    if (near.near) {
      const { count, duration } = mapSpeedRotation(walkerRef.current.absSpeed)
      if (walkerRef.current.direction === 'right' || walkerRef.current.direction === 'left') {

        gsap.to(ref.current.rotation, {
          y: walkerRef.current.direction === 'right' ? `+=${count * Math.PI}` : `-=${count * Math.PI}`,
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
      if (walkerRef.current.direction === 'up' || walkerRef.current.direction === 'down') {
        gsap.to(ref.current.rotation, {
          x: walkerRef.current.direction === 'down' ? `+=${count * Math.PI}` : `-=${count * Math.PI}`,
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
      // gsap.to(ref.current.rotation, {
      //   y: getDirection(walkerRef.current.direction),//`+=${count * Math.PI}`,//walkerRef.current.direction === 'right' ? `+=${count * Math.PI}` : `-=${count * Math.PI}`,
      //   ease: "elastic.out",
      //   delay: 0.03,
      //   // stagger: 2,
      //   duration: 3,
      //   onComplete: () => {
      //     setNear(prev => ({ ...prev, near: false }))

      //     // If this is a red tile (i.e a tile that needs to be flipped in order to win) -> then we increment!
      //     //onComplete(value => value + 1);
      //   },
      // });
    }
  }, [near.near])
  return (
    <mesh
      ref={ref}
      position={position}
      scale={scale}
      visible={visible}
    >
      <boxGeometry />
      <meshStandardMaterial color={color} />
    </mesh>
  )
})


const Walker = forwardRef(function (props, ref) {
  return (
    <mesh ref={ref} position={ref.current ? ref.current.position : [0, 0, 0]} scale={[0.5, 0.5, 0.5]}>
      <sphereGeometry />
      <meshNormalMaterial />
    </mesh>
  );
})


