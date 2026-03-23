"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog"
import { Button } from "../ui/button"
import { Label } from "../ui/label"

/* interface SettingsDialogProps {
  limit: number;
} */

export const BerthAvailability = () => {
//export const BerthAvailability = ({limit}: SettingsDialogProps) => {

    const limit: number = 6;
    const [berths, setBerths] = useState(["", "", "", "", "", ""]);

    const addBerth = () => {
        if (berths.length < limit) {
        setBerths([...berths, ""]);
        }
    };

    const removeBerth = (index: number) => {
        if (index === 0) return;
        const updated = berths.filter((_, i) => i !== index);
        setBerths(updated);
    };

    const updateBerth = (index: number, value: string) => {
        const updated = [...berths];
        updated[index] = value;
        setBerths(updated);
    };    

    const [isDialogOpen, setIsDialogOpen] = useState(true)
    const [berthAvailability] = useState(limit)
    //const [berthAvailability, setBerthAvailability] = useState(limit)

    const handleSubmit = async () => {
    }
  
    return (      
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl p-0">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-4 border-b-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">Berth Availability</h2>
                        </div>
                        <div>
                            <h3 className="text-sm">Enter the names of the terminal's berth below.</h3>
                        </div>
                    </DialogHeader>
                    <div className="space-y-3">
                    {berths.map((value, index) => (
                        <div key={index} className="flex items-center gap-2">
                        <Label className="w-20">Berth {index + 1}</Label>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => updateBerth(index, e.target.value)}
                            className="w-32"
                            // className="w-32"  flex-1 border rounded px-2 py-1"
                        />

                        {index === berths.length - 1 && berths.length < berthAvailability ? (
                            <button
                            onClick={addBerth}
                            className="px-2 py-1 bg-green-500 text-white rounded"
                            >
                            Add
                            </button>
                        ) : (
                            <button
                            onClick={() => removeBerth(index)}
                            disabled={index === 0}
                            className={`px-2 py-1 rounded text-white ${
                                index === 0
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-red-500"
                            }`}
                            >
                            Remove
                            </button>
                        )}
                        </div>
                    ))}
                    </div>
                    <br/>
                    <br/>
                    <div className="flex justify-end gap-2 mr-4">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                        </Button>
                        <Button type="submit">Enter Berth Availability</Button>
                    </div>
                    <br/>
                </form>
            </DialogContent>
        </Dialog>
    );
}
 