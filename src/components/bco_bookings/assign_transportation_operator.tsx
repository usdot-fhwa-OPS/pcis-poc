import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Label, Input } from "@aws-amplify/ui-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel } from "@radix-ui/react-select";
import { Loader2 } from "lucide-react";
import { User } from "../users/columns";

export const assignTransportationOperator = (isDialogOpen: any, row: any, handleOpen: any, setIsDialogOpen: any,
                         tempEmail: any, tempName: any, isLoading: any, handleOperatorSelect: any,
                         data: User[], getSelectItem: any, handleSubmit: any) =>{

  
return (
    <>
    <Dialog 
                  open={isDialogOpen} 
                  onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    
                  }}
                >
                  <DialogTrigger asChild>
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger>
                         <Button onClick={handleOpen} variant="outline" disabled={row.original.containerStatus === "On-Ship"} className="bg-blue-600 text-white hover:bg-blue-700">Assign</Button>
                        </TooltipTrigger>
                        {row.original.containerStatus === "On-Ship" && (
                          <TooltipContent>
                            <p>Container still on ship. Cannot assign operator yet.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Transportation Operator</DialogTitle>
                      <DialogDescription>
                      Enter a Transportation Operator name and email to assign this container.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <div>
                        <Label>Transportation Operator</Label>
                        <Select value={tempEmail} onValueChange={handleOperatorSelect} disabled={isLoading}>
                          <SelectTrigger className="w-full">
                            <div className="flex items-center gap-2">
                              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                              <SelectValue placeholder="Select operator" >
                              {tempName}  
                              </SelectValue>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Trucking Operators</SelectLabel>
                              {data.map(user => {
                                if ('Trucking Operator' === `${user["custom:role"]}`) {
                                      return getSelectItem(user);
                                }
                              })}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>Rail Operators</SelectLabel>
                              {data.map(user => {
                                if ('Rail Operator' === `${user["custom:role"]}`) {
                                      return getSelectItem(user);
                                }
                              })}
                            </SelectGroup>
                            <SelectGroup>
                              <SelectLabel>Third Party Logistic Providers</SelectLabel>
                              {data.map(user => {
                                
                                if ('Third Party Logistics Provider' === `${user["custom:role"]}`) {
                                      return getSelectItem(user);
                                }
                              })}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Transportation Operator Email</Label>
                        <Input
                          value={tempEmail}
                          disabled={true}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit} disabled={!tempName.trim() || !tempEmail.trim()}>
                        Submit
                        </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              

    </>
);

}