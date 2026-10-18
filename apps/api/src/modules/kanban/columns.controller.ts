import { ColumnInput, Version } from "@azul/contracts";
import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ActorRequest, parse } from "../../infrastructure/http";
import { SessionGuard } from "../identity";
import { ColumnsService } from "./columns.service";
@ApiTags("Columns")
@UseGuards(SessionGuard)
@Controller("projects/:projectId")
export class ColumnsController {
  constructor(private service: ColumnsService) {}
  @Post("columns") async createColumn(
    @Param("projectId") id: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.service.createColumn(id, req, parse(ColumnInput, body));
  }
  @Patch("columns/:columnId") async updateColumn(
    @Param("projectId") id: string,
    @Param("columnId") columnId: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.service.updateColumn(
      id,
      columnId,
      req,
      parse(ColumnInput, body),
    );
  }
  @Delete("columns/:columnId") async deleteColumn(
    @Param("projectId") id: string,
    @Param("columnId") columnId: string,
    @Req() req: ActorRequest,
    @Body() body: unknown,
  ) {
    return this.service.deleteColumn(id, columnId, req, parse(Version, body));
  }
}
