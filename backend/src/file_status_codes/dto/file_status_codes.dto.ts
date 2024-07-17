import { ApiProperty } from "@nestjs/swagger";

export class FileStatusCode {
    @ApiProperty({
        description: 'File status code',
    })
    submission_status_code: string;

    @ApiProperty({
        description: 'File status code description',
    })
    description: string;

    @ApiProperty({
        description: 'Display order',
    })
    display_order: number;

    @ApiProperty({
        description: 'Active indicator',
    })
    active_ind: boolean;

    @ApiProperty({
        description: 'Create user id',
    })
    create_user_id: string;

    @ApiProperty({
        description: 'Create utc timestamp',
    })
    create_utc_timestamp: Date;

    @ApiProperty({
        description: 'Update user id',
    })
    update_user_id: string;

    @ApiProperty({
        description: 'Update utc timestamp',
    })
    update_utc_timestamp: Date;
}