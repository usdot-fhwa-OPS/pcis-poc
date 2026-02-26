
import { Label } from "../ui/label";
import { Input } from "../ui/input";


export function DailyRepeatOptions({dailyEvery, setDailyEvery}:{dailyEvery:any, setDailyEvery:any}) {
       
  return (

    <>
      <div className="col-start-1 col-end-2 ...">
                                <Label htmlFor="terminalCapacity" className="text-right">
                                    Every
                                </Label>
    </div>
      <div className="col-3">
        
                <Input
                    id="dailyEvery"
                    
                    type="number"
                    value={dailyEvery}
                    onChange={(e) => setDailyEvery(e.target.value)}
                    className="col-span-1"
                    min="0"
                    step="1"
                />
                
        
    </div>
    <div className="col-start-3 col-end-6 ...">
                            <Label htmlFor="terminalCapacity" className="text-left">
                                days
                            </Label>
                            
                        </div> 
    <div className="col-span-5">
        <span>This temporary capacity will repeat every {dailyEvery} days.</span>
    </div>
                        
    </>


  )
}

