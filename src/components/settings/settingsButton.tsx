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
  
    const handleSubmit = async () => {
      try {
        const { data: updateTerminalCapacity } = await client.models.Limit.update({ 

          id: '0c1aee99-e95e-4c61-920d-52faea4dbbd5',

          terminalCapacity: terminalCapacity, 
        }, {
          authMode: 'apiKey',
        })
        console.log("updated terminal capacity", updateTerminalCapacity) 
      } catch (error) {
        console.error ("error updating terminal capacity", error); 
      }
      setOpen(false)
    }
    
    return (
      <Button onClick={navigateToCapacity} variant="ghost" size="icon" className="h-8 w-8 mr-0">
             <Settings className="h-4 w-4" />
             <span className="sr-only">Open settings</span>
      </Button>
     )
  }  

