"use client"

import { useState, useEffect } from "react"
import { Settings } from "lucide-react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
const client = generateClient<Schema>();
interface SettingsDialogProps {
  role: string
  limit: number
}

export default function SettingsButton({ role, limit }: SettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const [portCapacity, setPortCapacity] = useState(limit)

    useEffect(() => {
      setPortCapacity(limit);
    }, [limit]);

    // If user is not a Terminal Operator, don't render anything
    if (role !== "Terminal Operator") {
      return null
    }
  
    const handleSubmit = async () => {
      try {
        const { data: updatePortCapacity } = await client.models.Limit.update({
          id: 'fb06313f-66fa-47e7-830c-20f343b9339c',
          portCapacity: portCapacity,
        }, {
          authMode: 'apiKey',
        })
        console.log("updated port capacity", updatePortCapacity)
      } catch (error) {
        console.error ("error updating port capacity", error);
      }
      setOpen(false)
    }
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 mr-0">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Open settings</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>Adjust your application settings here.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="portCapacity" className="text-right">
                  Port Capacity
                </Label>
                <Input
                  id="portCapacity"
                  type="number"
                  value={portCapacity}
                  onChange={(e) => setPortCapacity(Number(e.target.value))}
                  className="col-span-3"
                  min="0"
                  step="1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }  

