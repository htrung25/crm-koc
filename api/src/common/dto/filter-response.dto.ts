import { Type as NestType, applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  getSchemaPath,
} from '@nestjs/swagger';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
/** Trần cứng để client không kéo nguyên bảng bằng ?limit=1000000 */
export const MAX_LIMIT = 100;

export class FilterResponseDto<T> {
  // Không @ApiProperty: schema của data do ApiFilterResponse ghép theo endpoint,
  // vì generic của TypeScript bị xoá lúc chạy nên Swagger không tự suy ra được.
  data: T[];

  @ApiProperty({ example: 42, description: 'Total rows matching the filter' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: DEFAULT_LIMIT })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

/** Thay cho @ApiOkResponse ở các endpoint danh sách. */
export const ApiFilterResponse = <M extends NestType<unknown>>(model: M) =>
  applyDecorators(
    ApiExtraModels(FilterResponseDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(FilterResponseDto) },
          {
            properties: {
              data: { type: 'array', items: { $ref: getSchemaPath(model) } },
            },
          },
        ],
      },
    }),
  );
