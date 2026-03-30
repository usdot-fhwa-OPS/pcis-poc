"use client"

import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export const AddBerthRequest = () => {

    return (
    <>
        <div className="grid grid-cols-5 gap-2">
            <div className="col-1">
                <Label htmlFor="berthRequestTerminal">
                    Terminal
                </Label>
            </div>
            <div className="col-start-2 col-end-6">
                <Select>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Terminal Name 1">
                            Terminal Name 1
                        </SelectItem>
                        <SelectItem value="Terminal Name 2">
                            Terminal Name 2
                        </SelectItem>
                    </SelectContent>
                </Select>
                <div>
                    <p>To contact this terminal directly:</p>
                    <div>
                        <p>Terminal Name</p>
                        <p>Phone: 555-555-5555</p>
                        <p>Email: name@company.com</p>
                    </div>
                </div>
            </div>
            <div className="col-1">
                <Label htmlFor="berthRequestEta">
                    Estimated Arrival
                </Label>
            </div>
            <div className="col-start-2 col-end-6">
                Date and time
            </div>
            <div className="col-1">
                <Label htmlFor="berthRequestEtd">
                    Estimated Departure
                </Label>
            </div>
            <div className="col-start-2 col-end-6">
                Date and time
            </div>
            <div className="col-1">
                Services Required
            </div>
            <div className="col-start-2 col-end-6">
                <Checkbox id="berthRequestServicesFuel" value="Fuel"/>
                <Label htmlFor="berthRequestServicesFuel">
                    Fuel
                </Label>
                <Checkbox id="berthRequestServicesFood" value="Food"/>
                <Label htmlFor="berthRequestServicesFood">
                    Food
                </Label>
                <Checkbox id="berthRequestServicesWater" value="Water"/>
                <Label htmlFor="berthRequestServicesWater">
                    Water
                </Label>
                <Checkbox id="berthRequestServicesCrew" value="Crew Services"/>
                <Label htmlFor="berthRequestServicesCrew">
                    Crew Services
                </Label>
                <Checkbox id="berthRequestServicesWaste" value="Waste Disposal"/>
                <Label htmlFor="berthRequestServicesWaste">
                    Waste Disposal
                </Label>
            </div>
            <div className="col-6">
                <h2>Attach a Cargo Manifest</h2>
                <p>Instructions for file attachment:</p>
                <ol>
                    <li>Locate your cargo manifest file on your computer.</li>
                    <li>Drag and drop the file into the upload area below or select &ldquo;Browse Files&rdquo; to find it.</li>
                    <li>A check mark will appear next to your file&rsquo;s name when it is uploaded.</li>
                </ol>
            </div>
            <div className="col-6">
                File upload area
            </div>
        </div>
    </>
    )
}