"use client"

import { Settings } from "lucide-react"
import { Button } from "../ui/button"
import { useNavigate } from "@tanstack/react-router" 

interface SettingsDialogProps {
  role: string
}

export default function SettingsButton({ role}: SettingsDialogProps) {
    const navigate = useNavigate(); 

    const navigateToCapacity = () => {
      navigate({ to: "/capacity" });
    }

    // If user is not a Terminal Operator, don't render anything
    if (role !== "Terminal Operator") {
      return null
    }
    
    return (
      <Button onClick={navigateToCapacity} variant="ghost" size="icon" className="[&_svg]:size-5">
        <Settings />
        <span className="sr-only">Open settings</span>
      </Button>
     )
  }  
