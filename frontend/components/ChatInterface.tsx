"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Bot, User, Loader2 } from "lucide-react"
import axios from 'axios'

// TODO: Move to environment variable
const API_BASE_URL = "http://localhost:8000"

interface Message {
    id: string
    role: 'user' | 'ai'
    content: string
    timestamp: Date
    triage?: any // Store structured triage data if available
}

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'ai',
            content: "Hello! I'm MedicSense AI. I can help you triage symptoms or manage appointments. How can I help you today?",
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await axios.post(`${API_BASE_URL}/chat/`, {
                message: userMessage.content
            })

            const data = response.data
            let aiContent = ""
            let triageData = null

            if (data.intent === 'symptom_triage') {
                triageData = data.response
                aiContent = `**Triage Assessment:** ${triageData.triage_level.replace('_', ' ').toUpperCase()}\n\n${triageData.explanation}\n\n*Disclaimer: ${triageData.disclaimer}*`
            } else {
                aiContent = data.response.message || JSON.stringify(data.response)
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: aiContent,
                timestamp: new Date(),
                triage: triageData
            }

            setMessages(prev => [...prev, aiMessage])
        } catch (error) {
            console.error("Error sending message:", error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: "I'm sorry, I encountered an error processing your request. Please try again.",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col shadow-xl">
            <CardHeader className="border-b bg-primary/5">
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Bot className="w-6 h-6" />
                    MedicSense AI Assistant
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>

                            <div
                                className={`rounded-lg p-3 text-sm ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                    }`}
                            >
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                {msg.triage && (
                                    <div className="mt-2 p-2 bg-background/50 rounded text-xs border border-border/50">
                                        <div className="font-semibold">Detected Symptoms:</div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {msg.triage.symptoms.map((s: string, i: number) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-background rounded-full border border-border">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-2 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="bg-muted rounded-lg p-3 flex items-center">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Thinking...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </CardContent>

            <CardFooter className="border-t p-4">
                <div className="flex w-full gap-2">
                    <Input
                        placeholder="Describe your symptoms..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                        <Send className="w-4 h-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
