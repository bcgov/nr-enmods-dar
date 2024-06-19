import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { Role } from "src/enum/role.enum";
import { IdirUserInfo, UserInfo } from "src/types/types";
import { UserRolesDto } from "./dto/user-roles.dto";

@Injectable()
export class AdminService {
  constructor(private readonly httpService: HttpService) {}

  async getToken() {
    const url = process.env.users_api_token_url;
    const token = `${process.env.users_api_client_id}:${process.env.users_api_client_secret}`;
    const encodedToken = Buffer.from(token).toString("base64");
    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + encodedToken,
      },
    };
    const grantTypeParam = new URLSearchParams();
    grantTypeParam.append("grant_type", "client_credentials");
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, grantTypeParam.toString(), config)
      );
      return response.data.access_token;
    } catch (error) {
      console.log(error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Gets a list of all users with the Enmods_Admin or the Enmods_User role
   *
   * @returns all users with specified roles users
   */
  async findAll(): Promise<any[]> {
    const bearerToken = await this.getToken();
    const adminUrl = `${process.env.users_api_base_url}/integrations/${process.env.integration_id}/${process.env.css_environment}/roles/${Role.ENMODS_ADMIN}/users`;
    const userUrl = `${process.env.users_api_base_url}/integrations/${process.env.integration_id}/${process.env.css_environment}/roles/${Role.ENMODS_USER}/users`;
    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };
    try {
      const adminResponse = await firstValueFrom(
        this.httpService.get(adminUrl, config)
      );

      const returnData: UserInfo[] = [];
      const adminData = adminResponse.data.data;
      adminData.map((admin: IdirUserInfo) => {
        returnData.push({
          username: admin.attributes.idir_username[0],
          email: admin.email,
          name: admin.firstName + " " + admin.lastName,
          company: "Not Implemented",
          role: [Role.ENMODS_ADMIN],
        });
      });
      const userResponse = await firstValueFrom(
        this.httpService.get(userUrl, config)
      );
      const userData = userResponse.data.data;
      userData.map((user: IdirUserInfo) => {
        const existingUser = returnData.find(
          (u) => u.username === user.attributes.idir_username[0]
        );
        if (existingUser) {
          existingUser.role.push(Role.ENMODS_USER);
        } else {
          returnData.push({
            username: user.attributes.idir_username[0],
            email: user.email,
            name: user.firstName + " " + user.lastName,
            company: "Not Implemented",
            role: [Role.ENMODS_USER],
          });
        }
      });
      return returnData;
    } catch (err) {
      console.log("Error findAll Admin");
      console.log(err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * finds a user given their email address
   *
   * @param email
   * @returns
   */
  async userEmailSearch(email: string): Promise<any> {
    const url = `${process.env.users_api_base_url}/${process.env.css_environment}/idir/users?&email=${email}`;
    const bearerToken = await this.getToken();

    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };

    const searchData: IdirUserInfo[] = await firstValueFrom(
      this.httpService.get(url, config)
    )
      .then((res) => {
        return res.data.data;
      })
      .catch((err) => {
        console.log(err.response.data);
        throw new Error("No users found");
      });
    return searchData[0] || null;
  }

  /**
   * Adds Enmods_Admin role, Enmods_User role, or both to a user
   *
   * @param userRolesDto
   * @returns
   */
  async addRoles(userRolesDto: UserRolesDto): Promise<any> {
    console.log("add roles");
    const addRolesUrl = `${process.env.users_api_base_url}/integrations/${process.env.integration_id}/${process.env.css_environment}/user-role-mappings`;
    const bearerToken = await this.getToken();

    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };

    // add admin role if specified
    if (userRolesDto.roles.includes(Role.ENMODS_ADMIN)) {
      await firstValueFrom(
        this.httpService.post(
          addRolesUrl,
          {
            roleName: Role.ENMODS_ADMIN,
            username: userRolesDto.idirUsername,
            operation: "add",
          },
          config
        )
      )
        .then((res) => {
          return res.data;
        })
        .catch((err) => {
          console.log(err);
          throw new Error("Failed to add admin role");
        });
    }
    // add user role if included
    if (userRolesDto.roles.includes(Role.ENMODS_USER)) {
      await firstValueFrom(
        this.httpService.post(
          addRolesUrl,
          {
            roleName: Role.ENMODS_USER,
            username: userRolesDto.idirUsername,
            operation: "add",
          },
          config
        )
      )
        .then((res) => {
          return res.data;
        })
        .catch((err) => {
          console.log(err);
          throw new Error("Failed to add user role");
        });
    }
    return null;
  }

  /**
   * Removes Enmods_Admin role, Enmods_User role, or both from a user
   *
   * @param userRolesDto
   * @returns
   */
  async removeRoles(userRolesDto: UserRolesDto): Promise<any> {
    console.log("remove roles");
    const bearerToken = await this.getToken();
    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };
    for (const role of userRolesDto.roles) {
      console.log(role);
      if (role === Role.ENMODS_USER) {
        const url = `${process.env.users_api_base_url}/integrations/${process.env.integration_id}/${process.env.css_environment}/users/${userRolesDto.idirUsername}@idir/roles/${Role.ENMODS_USER}`;
        await firstValueFrom(this.httpService.get(url, config))
          .then((res) => {
            return res.data.data;
          })
          .catch((err) => console.log(err.response.data));
      }
      if (role === Role.ENMODS_ADMIN) {
        const url = `${process.env.users_api_base_url}/integrations/${process.env.integration_id}/${process.env.css_environment}/users/${userRolesDto.idirUsername}@idir/roles/${Role.ENMODS_ADMIN}`;
        await firstValueFrom(this.httpService.get(url, config))
          .then((res) => {
            return res.data.data;
          })
          .catch((err) => console.log(err.response.data));
      }
    }
    return null;
  }
}
