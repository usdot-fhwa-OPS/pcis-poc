import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Input } from "@aws-amplify/ui-react";
import { User } from "../users/columns";
import { useState } from "react";
import { BCODataTableMeta } from "./data-table";
import { Label } from "../ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LucideChevronDown, LucideTramFront, LucideTruck, LucideUsers } from "lucide-react";


export const assignTransportationCoordinatorAndDispatcher = (table: any, row: any) => {

        const [data, setData] = useState<User[]>([])
        const [tempName, setTempName] = useState("")
        const [tempEmail, setTempEmail] = useState("")
        const [isDialogOpen, setIsDialogOpen] = useState(false)
       
        const handleOpen = async () => {
          setIsDialogOpen(true)
          const result = await (table.options.meta as BCODataTableMeta)?.fetchTransportationCoordinatorAndDispatcher();
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
          (table.options.meta as BCODataTableMeta)?.assignTransOp(row.original.cargoUnitID, tempName, tempEmail, "Pending Transportation Coordinator and dispatcher Approval")
          setIsDialogOpen(false)
        }

        
                const getMenuItem = (user: User) => {
            const fullName = `${user.given_name} ${user.family_name}`;
            return (
                <div className="flex">
                    <DropdownMenuItem  onClick={()=>handleOperatorSelect(user.email)} > &nbsp;&nbsp;&nbsp;&nbsp;{user["custom:organization"] ? user["custom:organization"] : fullName} </DropdownMenuItem>
                    
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
                        <DialogTitle>Assign Transportation Coordinator and dispatcher</DialogTitle>
                        <DialogDescription>
                            Select a Transportation Coordinator and dispatcher name and email to assign this container.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" disabled={row.original.containerStatus === "On-Ship"}  >Select Transportation Coordinator and dispatcher <LucideChevronDown />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="start">
                                    <DropdownMenuGroup>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger  ><LucideTramFront />Rail Operators</DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    {data.map(user => {
                                                        if ('Rail Operator' === `${user["custom:role"]}`) {
                                                            return getMenuItem(user)
                                                        }
                                                    })}

                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger><LucideUsers /> Third Party Logistic Providers</DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    {data.map(user => {
                                                        if ('Third Party Logistics Provider' === `${user["custom:role"]}`) {
                                                            return getMenuItem(user)
                                                        }
                                                    })}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger><LucideTruck /> Trucking Operators</DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    {data.map(user => {
                                                        if ('Trucking Operator' === `${user["custom:role"]}`) {
                                                            return getMenuItem(user)
                                                        }
                                                    })}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div>
                            <Label>Transportation Coordinator and dispatcher Email</Label>
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
