'use client'
import { drawLine } from '@/utils/drawLine'
import { useDraw } from '@/utils/useDraw'
import { useEffect, useState } from 'react'
import { HuePicker } from 'react-color'
import { io } from 'socket.io-client'
const socket = io('http://localhost:3010')

export default function Canvas() {
	const [color, setColor] = useState<string>('#000')
	const { canvasRef, onMouseDown, clear } = useDraw(createLine)
	const [messages, setMessages] = useState<string[]>([])
	const [message, setMessage] = useState<string>('')

	useEffect(() => {
		const ctx = canvasRef.current?.getContext('2d')
		socket.emit('client-ready')

		socket.on('get-canvas-state', () => {
			if (!canvasRef.current?.toDataURL()) return
			socket.emit('canvas-state', canvasRef.current.toDataURL())
		})

		socket.on('canvas-state-from-server', (state: string) => {
			const img = new Image()
			img.src = state
			img.onload = () => {
				ctx?.drawImage(img, 0, 0)
			}
		})

		socket.on(
			'draw-line',
			({ prevPoint, currentPoint, color }: DrawLineProps) => {
				if (!ctx) return
				drawLine({ prevPoint, currentPoint, ctx, color })
			}
		)

		socket.on('clear', clear)

		socket.on('chat', ({ message, senderId }) => {
			setMessages(prevMessages => [...prevMessages, `${senderId}: ${message}`])
		})

		return () => {
			socket.off('get-canvas-state')
			socket.off('canvas-state-from-server')
			socket.off('draw-line')
			socket.off('clear')
			socket.off('chat')
		}
	}, [canvasRef])

	function createLine({ prevPoint, currentPoint, ctx }: Draw) {
		socket.emit('draw-line', { prevPoint, currentPoint, color })
		drawLine({ prevPoint, currentPoint, ctx, color })
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		socket.emit('chat', { message, senderId: socket.id })
		setMessage('')
	}

	return (
		<div className="flex flex-col lg:flex-row gap-4">
			<div className="flex flex-col items-center gap-4">
				<HuePicker color={color} onChange={e => setColor(e.hex)} />
				<input
					type="text"
					value={color}
					onChange={e => setColor(e.target.value)}
					className="p-1 rounded-md border border-black"
				/>
				<button
					type="button"
					onClick={() => socket.emit('clear')}
					className="px-2 py-1 rounded-md border border-black"
				>
					Clear
				</button>
			</div>
			<canvas
				onMouseDown={onMouseDown}
				ref={canvasRef}
				width={750}
				height={750}
				className="border border-black rounded-md"
			/>
			<div className="flex flex-col items-center justify-center">
				<form onSubmit={handleSubmit} className="flex flex-col">
					<input
						value={message}
						onChange={e => setMessage(e.target.value)}
						type="text"
						placeholder="Message..."
						maxLength={128}
						className="border border-black rounded-md p-1"
						required
					/>
					<button
						type="submit"
						className="px-2 py-1 rounded-md border border-black mt-2"
					>
						Send
					</button>
				</form>
				<div className="max-h-56 max-w-96 break-all overflow-auto mt-6">
					{messages.map((message, index) => (
						<div key={index} className="flex gap-1 pt-4">
							<span className="truncate">{message.split(':')[0]}</span>
							<span>:</span>
							<span>{message.split(':')[1]}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
