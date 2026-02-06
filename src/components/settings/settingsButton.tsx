"use client"

import { Settings } from "lucide-react"
import { Button } from "../ui/button"
import { useNavigate } from "@tanstack/react-router" 

interface SettingsDialogProps {
  role: string
}

export default function SettingsButton({ role}: SettingsDialogProps) {
    const navigate = useNavigate(); 

    // If user is not a Terminal Operator, don't render anything
    if (role !== "Terminal Operator") {
      return null
    }
    
    return (
      <Button onClick={navigate({ to: "/capacity" })} variant="ghost" size="icon" className="h-8 w-8 mr-0">
             <Settings className="h-4 w-4" />
             <span className="sr-only">Open settings</span>
      </Button>
     )
  }  

