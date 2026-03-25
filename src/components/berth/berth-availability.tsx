"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog"
import { Button } from "../ui/button"
import { Label } from "../ui/label"

export const BerthAvailability = () => {
    let limit: number = 10;
    const [berths, setBerths] = useState(["","","","","","","","","",""]); //default 10

    const updateLimit = () => {
        if(berthAvailability>berths.length) {
            while(berths.length < berthAvailability) { 
                limit++;
                berths.push("");           
            }    
        } else if (berthAvailability<berths.length) {
            while(berths.length > berthAvailability) {   
               limit--;        
               berths.pop();
            }
        }
        setBerths([...berths]); //needed to refresh
    };

    const addBerth = () => {
        if (berths.length < limit) {
            setBerths([...berths, ""]);
        }
    };

    const removeBerth = (index: number) => {
        if (berths.length === 1) return;
        setBerths(berths.filter((_, i) => i !== index));
    };

    const updateBerth = (index: number, value: string) => {
        const updated = [...berths];
        updated[index] = value;
        setBerths(updated);
    };    

    const [isDialogOpen, setIsDialogOpen] = useState(true)

    const [berthAvailability, setBerthAvailability] = useState(limit)

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
                    <div className="ml-4 flex gap-2">
                        <Label>
                            Berths Available:
                        </Label>
*                       <input id="berthAvailability" type="number" min={1} max={limit} value={berthAvailability}
                            onChange={(e) =>
                                setBerthAvailability(Number(e.target.value))
                            }
                            step="1"
                            className="w-8"/>
                            <button type="button" onClick={updateLimit}
                            className="px-2 py-1 bg-green-500 text-white rounded">
                                Update
                        </button>                                 
                    </div> 
                    <br/>                   
                    <div className="space-y-3">
                        {berths.map((value, index) => (
                            <div key={index} className="ml-4 flex items-center gap-2">
                            <Label className="w-12">Berth {index + 1}</Label>
                            <input
                                type="text"
                                value={value}
                                maxLength={30}
                                onChange={(e) => updateBerth(index, e.target.value)}
                                className="border px-2 py-1 w-[30ch]" />

                            {index === berths.length - 1 && berths.length < limit ? (
                                <button type="button"
                                onClick={addBerth}
                                className="px-2 py-1 bg-green-500 text-white rounded"
                                >
                                Add
                                </button>
                            ) : (
                                <button type="button"
                                onClick={() => removeBerth(index)}
                                disabled={berths.length === 1}
                                className={`px-2 py-1 rounded text-white ${
                                berths.length === 1
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
 