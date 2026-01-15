import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Input } from "@aws-amplify/ui-react";
import { User } from "../users/columns";
import { useState } from "react";
import { BCODataTableMeta } from "./data-table";
import { Label } from "../ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";


export const assignTransportationOperator = (table: any, row: any) => {

        const [data, setData] = useState<User[]>([])
        const [tempName, setTempName] = useState("")
        const [tempEmail, setTempEmail] = useState("")
        const [isDialogOpen, setIsDialogOpen] = useState(false)
       
        const handleOpen = async () => {
          setIsDialogOpen(true)
          const result = await (table.options.meta as BCODataTableMeta)?.fetchTransportationOperators();
          setData(result)
        }

        const handleOperatorSelect = (value: string) => {
          setTempEmail(value);
          const selectedUser = data.find(
            (user) => `${user.email}` === value
          );
          if (selectedUser) {
            setTempName( `${selectedUser.given_name} ${selectedUser.family_name}`);
          }
        };

        function handleSubmit() {
          // Use the parent's updateCargo method:
          (table.options.meta as BCODataTableMeta)?.assignTransOp(row.original.containerID, tempName, tempEmail, "Pending Transportation Operator Approval")
          setIsDialogOpen(false)
        }

        
                const getMenuItem = (user: User) => {
            const fullName = `${user.given_name} ${user.family_name}`;
            return (
                <div className="flex">
                    <DropdownMenuItem  onClick={()=>handleOperatorSelect(user.email)} >{user["custom:organization"] ? user["custom:organization"] : fullName}</DropdownMenuItem>
                    
                </div>

            );
        };

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
                            Select a Transportation Operator name and email to assign this container.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" disabled={row.original.containerStatus === "On-Ship"} className="bg-blue-600 text-white hover:bg-blue-700" >List Transportation Operator</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="start">
                                    <DropdownMenuLabel>Trucking Operators</DropdownMenuLabel>
                                    <DropdownMenuGroup>
                                        {data.map(user => {
                                            if ('Trucking Operator' === `${user["custom:role"]}`) {
                                                return getMenuItem(user)
                                            }
                                        })}

                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Rail Operators</DropdownMenuLabel>
                                    <DropdownMenuGroup>
                                        {data.map(user => {
                                            if ('Rail Operator' === `${user["custom:role"]}`) {
                                                return getMenuItem(user)
                                            }
                                        })}

                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Third Party Logistic Providers</DropdownMenuLabel>
                                    <DropdownMenuGroup>
                                        {data.map(user => {
                                            if ('Third Party Logistics Provider' === `${user["custom:role"]}`) {
                                                return getMenuItem(user)
                                            }
                                        })}

                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
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