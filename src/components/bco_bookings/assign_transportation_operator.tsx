import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Input } from "@aws-amplify/ui-react";
import { User } from "../users/columns";
import { useState } from "react";
import { BCODataTableMeta } from "./data-table";
import { Label } from "../ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LucideChevronDown, LucideTramFront, LucideTruck, LucideUsers } from "lucide-react";
import { normalizeHolds } from "../cargo/cargo-availability"

export default function TransportationCoordinator({ row, table }: { row: any, table: any }) {

    const [data, setData] = useState<User[]>([])
    const [tempName, setTempName] = useState("")
    const [tempEmail, setTempEmail] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
  
    const holds = normalizeHolds(row.original.holds)
    const hasHolds = holds.length > 0
    const isOnShip = row.original.containerStatus === "On-Ship"
    const isAssignDisabled = isOnShip || hasHolds
    
    const disabledReason = isOnShip
        ? "Container still on ship. Cannot assign operator yet."
        : hasHolds
            ? `Cannot assign a Transportation Coordinator while cargo has holds: ${holds.join(", ")}.`
            : null

    const handleOpen = async () => {
        if (isAssignDisabled) return
        setIsDialogOpen(true)
        const result = await (table.options.meta as BCODataTableMeta)?.fetchTransportationCoordinators();
        setData(result)
    }
    
    function handleSubmit() {
        if (isAssignDisabled) return
        (table.options.meta as BCODataTableMeta)?.assignTransOp(row.original.cargoUnitID, tempName, tempEmail, "Pending Transportation Coordinator Approval")
        setIsDialogOpen(false)
    }

    const handleOperatorSelect = (value: string) => {
        setTempEmail(value);
        const selectedUser = data.find(
            (user) => `${user.email}` === value
        );
        if (selectedUser) {
            setTempName(`${selectedUser.given_name} ${selectedUser.family_name}`);
        }
    };


    const getMenuItem = (user: User) => {
        const fullName = `${user.given_name} ${user.family_name}`;
        return (
            <div className="flex">
                <DropdownMenuItem onClick={() => handleOperatorSelect(user.email)} > &nbsp;&nbsp;&nbsp;&nbsp;{user["custom:organization"] ? user["custom:organization"] : fullName} </DropdownMenuItem>

            </div>

        );
    };
    // If either operator OR email is missing, show "Book" button
    const isMissing = !row.original.transopName?.trim() || !row.original.transopEmail?.trim()
    if (isMissing) {
        return (
            //assignTransportationCoordinator( table, row)
            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open)

                }}
            >
              <DialogTrigger asChild>
                  <span className="inline-block">
                      <TooltipProvider>
                          <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                  <span tabIndex={isAssignDisabled ? 0 : -1}>
                                      <Button
                                          onClick={handleOpen}
                                          variant="outline"
                                          disabled={isAssignDisabled}
                                          className="bg-blue-600 text-white hover:bg-blue-700 disabled:pointer-events-none"
                                      >
                                          Assign
                                      </Button>
                                  </span>
                              </TooltipTrigger>
                              {disabledReason && (
                                  <TooltipContent>
                                      <p>{disabledReason}</p>
                                  </TooltipContent>
                              )}
                          </Tooltip>
                      </TooltipProvider>
                  </span>
              </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Transportation Coordinator</DialogTitle>
                        <DialogDescription>
                            Select a Transportation Coordinator name and email to assign this container.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" disabled={isAssignDisabled}>Select Transportation Coordinator<LucideChevronDown />
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
                            <Label>Transportation Coordinator Email</Label>
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
                        <Button onClick={handleSubmit} disabled={isAssignDisabled || !tempName.trim() || !tempEmail.trim()}>
                          Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    // If both operator and email are already filled, just display operator's name
    return <span>{row.original.transopName}</span>
}
