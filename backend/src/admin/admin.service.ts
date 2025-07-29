import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { Role } from "src/enum/role.enum";
import { BCeIDUserInfo, IdirUserInfo, UserInfo } from "src/types/types";
import { UserRolesDto } from "./dto/user-roles.dto";
import axios from "axios";

@Injectable()
export class AdminService {
  constructor(private readonly httpService: HttpService) {}
  private readonly logger = new Logger(AdminService.name);

  async getToken() {
    const url = process.env.USERS_API_TOKEN_URL;
    const token = `${process.env.USERS_API_CLIENT_ID}:${process.env.USERS_API_CLIENT_SECRET}`;
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
        this.httpService.post(url, grantTypeParam.toString(), config),
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
    const adminUrl = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/roles/${Role.ENMODS_ADMIN}/users`;
    const userUrl = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/roles/${Role.ENMODS_USER}/users`;
    const deleteUrl = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/roles/${Role.ENMODS_DELETE}/users`;
    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };

    try {
      const adminResponse = await firstValueFrom(
        this.httpService.get(adminUrl, config),
      );

      // TODO: Check to see what the account type is of the logged in user, based on that pass along an additional filter of the business name. This is to ensure that bceid users can only see users in their company

      const returnData: UserInfo[] = [];
      const adminData = adminResponse.data.data;
      adminData.map((admin: any) => {
        let accountType = admin?.username?.endsWith("@idir") ? "idir" : "bceid";
        const adminId =
          admin?.attributes?.idir_username?.[0] ||
          admin?.attributes?.bceid_username[0];

        if (accountType === "idir") {
          returnData.push({
            username: adminId,
            email: admin.email,
            name: admin.firstName + " " + admin.lastName,
            firstName: admin.firstName,
            lastName: admin.lastName,
            company: adminId,
            guidUsername: admin.username,
            role: [Role.ENMODS_ADMIN],
          });
        } else {
          const [firstName, lastName] =
            admin?.attributes?.display_name[0].split(" ", 2);
          returnData.push({
            username: adminId,
            email: admin.email,
            name: firstName + " " + lastName,
            firstName: firstName,
            lastName: lastName,
            company: admin?.attributes?.bceid_business_name,
            guidUsername: admin.username,
            role: [Role.ENMODS_ADMIN],
          });
        }
      });
      const userResponse = await firstValueFrom(
        this.httpService.get(userUrl, config),
      );
      const userData = userResponse.data.data;
      userData.map((user: any) => {
        let accountType = user?.username?.endsWith("@idir") ? "idir" : "bceid";
        const userId =
          user?.attributes?.idir_username?.[0] ||
          user?.attributes?.bceid_username[0];
        const existingUser = returnData.find((u) => u.username === userId);
        if (existingUser) {
          existingUser.role.push(Role.ENMODS_USER);
        } else {
          if (accountType === "idir") {
            returnData.push({
              username: userId,
              email: user.email,
              name: user.firstName + " " + user.lastName,
              firstName: user.firstName,
              lastName: user.lastName,
              company: userId,
              guidUsername: user.username,
              role: [Role.ENMODS_USER],
            });
          } else {
            const [firstName, lastName] =
              user?.attributes?.display_name[0].split(" ", 2);
            returnData.push({
              username: userId,
              email: user.email,
              name: firstName + " " + lastName,
              firstName: firstName,
              lastName: lastName,
              company: user?.attributes?.bceid_business_name,
              guidUsername: user.username,
              role: [Role.ENMODS_USER],
            });
          }
        }
      });
      const deleteResponse = await firstValueFrom(
        this.httpService.get(deleteUrl, config),
      );
      const deleteData = deleteResponse.data.data;
      deleteData.map((deleteUser: any) => {
        let accountType = deleteUser?.username?.endsWith("@idir")
          ? "idir"
          : "bceid";
        const userId =
          deleteUser?.attributes?.idir_username?.[0] ||
          deleteUser?.attributes?.bceid_username[0];
        const existingUser = returnData.find((u) => u.username === userId);
        if (existingUser) {
          existingUser.role.push(Role.ENMODS_DELETE);
        } else {
          if (accountType === "idir") {
            returnData.push({
              username: userId,
              email: deleteUser.email,
              name: deleteUser.firstName + " " + deleteUser.lastName,
              firstName: deleteUser.firstName,
              lastName: deleteUser.lastName,
              company: userId,
              guidUsername: deleteUser.username,
              role: [Role.ENMODS_DELETE],
            });
          } else {
            const [firstName, lastName] =
              deleteUser?.attributes?.display_name[0].split(" ", 2);
            returnData.push({
              username: userId,
              email: deleteUser.email,
              name: firstName + " " + lastName,
              firstName: firstName,
              lastName: lastName,
              company: deleteUser?.attributes?.bceid_business_name,
              guidUsername: deleteUser.username,
              role: [Role.ENMODS_DELETE],
            });
          }
        }
      });
      return returnData;
    } catch (err) {
      console.log("Error findAll Admin");
      console.log(err.response?.data || err.message);
      return [true];
    }
  }

  /**
   * Checks to see if AQI is active
   *
   * @returns all true or false
   */
  async getAqiStatus(): Promise<Boolean> {
    const healthcheckUrl = process.env.AQI_BASE_URL + "/v1/status";
    let aqiStatus = null;
    try {
      aqiStatus = (await axios.get(healthcheckUrl)).status;
      console.log(aqiStatus);
    } catch (err) {
      aqiStatus = err.response.status;
    }

    if (aqiStatus == 200) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * finds a user given their email address
   *
   * @param email
   * @returns
   */
  async userEmailSearch(email: string): Promise<any> {
    const url = `${process.env.USERS_API_BASE_URL}/${process.env.CSS_ENVIRONMENT}/idir/users?&email=${email}`;
    const bearerToken = await this.getToken();

    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };

    const searchData: IdirUserInfo[] = await firstValueFrom(
      this.httpService.get(url, config),
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
   * finds a bceid user given their email
   *
   * @param email
   * @returns
   */
  async bceidUserEmailSearch(email: string): Promise<any> {
    const url = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/bceid/users?bceidType=both&email=${email}`;
    const bearerToken = await this.getToken();
    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };
    const searchData: BCeIDUserInfo[] = await firstValueFrom(
      this.httpService.get(url, config),
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
    const addRolesUrl = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/users/${userRolesDto.idirUsername}/roles`;
    const bearerToken = await this.getToken();

    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };

    // add admin role if specified
    if (userRolesDto.roles.includes(Role.ENMODS_ADMIN)) {
      await firstValueFrom(
        this.httpService.post(
          addRolesUrl,
          [
            {
              name: Role.ENMODS_ADMIN,
            },
          ],
          config,
        ),
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
          [
            {
              name: Role.ENMODS_USER,
            },
          ],
          config,
        ),
      )
        .then((res) => {
          return res.data;
        })
        .catch((err) => {
          console.log(err);
          throw new Error("Failed to add user role");
        });
    }
    // add delete role if included
    if (userRolesDto.roles.includes(Role.ENMODS_DELETE)) {
      await firstValueFrom(
        this.httpService.post(
          addRolesUrl,
          [
            {
              name: Role.ENMODS_DELETE,
            },
          ],
          config,
        ),
      )
        .then((res) => {
          return res.data;
        })
        .catch((err) => {
          console.log(err);
          throw new Error("Failed to add delete role");
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
    const bearerToken = await this.getToken();
    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };
    for (const role of userRolesDto.roles) {
      if (role === Role.ENMODS_USER) {
        const url = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/users/${userRolesDto.idirUsername}/roles/${Role.ENMODS_USER}`;
        await firstValueFrom(
          this.httpService.delete(
            url,
            config,
          ),
        )
          .then((res) => {
            return res.data;
          })
          .catch((err) => {
            console.log(err);
            throw new Error(`Failed to remove ${Role.ENMODS_USER} role`);
          });
      }
      if (role === Role.ENMODS_ADMIN) {
        const url = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/users/${userRolesDto.idirUsername}/roles/${Role.ENMODS_ADMIN}`;
        await firstValueFrom(
          this.httpService.delete(
            url,
            config,
          ),
        )
          .then((res) => {
            return res.data;
          })
          .catch((err) => {
            console.log(err);
            throw new Error(`Failed to remove ${Role.ENMODS_ADMIN} role`);
          });
      }
      if (role === Role.ENMODS_DELETE) {
        const url = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/users/${userRolesDto.idirUsername}/roles/${Role.ENMODS_DELETE}`;
        await firstValueFrom(
          this.httpService.delete(
            url,
            config,
          ),
        )
          .then((res) => {
            return res.data;
          })
          .catch((err) => {
            console.log(err);
            throw new Error(`Failed to remove ${Role.ENMODS_DELETE} role`);
          });
      }
    }
    return null;
  }

  /**
   * Updates a user's roles
   *
   * @param userRolesDto
   * @returns
   */
  async updateRoles(
    idirUsername: string,
    existingRoles: string[],
    roles: string[],
  ): Promise<any> {
    const url = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/users/${idirUsername}/roles`;
    const bearerToken = await this.getToken();

    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };

    const rolesToRemove = existingRoles.filter((role) => !roles.includes(role));
    const rolesToAdd = roles.filter((role) => !existingRoles.includes(role));
    let validStatus = 200;
    for (let role of rolesToRemove) {
      if (role === Role.ENMODS_USER) {
        const removeUrl = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/users/${idirUsername}/roles/${role}`;
        await firstValueFrom(
          this.httpService.delete(
            removeUrl,
            config,
          ),
        )
          .then((res) => {
            return res.data;
          })
          .catch((err) => {
            console.log(err);
            validStatus = err.response.status;
            this.logger.error(`Failed to remove ${Role.ENMODS_USER} role`);
          });
      } else if (role === Role.ENMODS_ADMIN) {
        const removeUrl = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/users/${idirUsername}/roles/${role}`;
        await firstValueFrom(
          this.httpService.delete(
            removeUrl,
            config,
          ),
        )
          .then((res) => {
            return res.data;
          })
          .catch((err) => {
            console.log(err);
            validStatus = err.response.status;
            this.logger.error(`Failed to remove ${Role.ENMODS_ADMIN} role`);
          });
      } else if (role === Role.ENMODS_DELETE) {
        const removeUrl = `${process.env.USERS_API_BASE_URL}/integrations/${process.env.INTEGRATION_ID}/${process.env.CSS_ENVIRONMENT}/users/${idirUsername}/roles/${role}`;
        await firstValueFrom(
          this.httpService.delete(
            removeUrl,
            config,
          ),
        )
          .then((res) => {
            return res.data;
          })
          .catch((err) => {
            console.log(err);
            validStatus = err.response.status;
            this.logger.error(`Failed to remove ${Role.ENMODS_DELETE} role`);
          });
      }
    }

    for (let role of rolesToAdd) {
      if (role === Role.ENMODS_USER) {
        await firstValueFrom(
          this.httpService.post(
            url,
            [
              {
                name: Role.ENMODS_USER,
              },
            ],
            config,
          ),
        )
          .then((res) => {
            return res.data;
          })
          .catch((err) => {
            console.log(err);
            validStatus = err.response.status;
            this.logger.error(`Failed to add ${Role.ENMODS_USER} role`);
          });
      } else if (role === Role.ENMODS_ADMIN) {
        await firstValueFrom(
          this.httpService.post(
            url,
            [
              {
                name: Role.ENMODS_ADMIN,
              },
            ],
            config,
          ),
        )
          .then((res) => {
            return res.data;
          })
          .catch((err) => {
            console.log(err);
            validStatus = err.response.status;
            this.logger.error(`Failed to add ${Role.ENMODS_ADMIN} role`);
          });
      } else if (role === Role.ENMODS_DELETE) {
        await firstValueFrom(
          this.httpService.post(
            url,
            [
              {
                name: Role.ENMODS_DELETE,
              },
            ],
            config,
          ),
        )
          .then((res) => {
            return res.data;
          })
          .catch((err) => {
            console.log(err);
            validStatus = err.response.status;
            this.logger.error(`Failed to add ${Role.ENMODS_DELETE} role`);
          });
      }
    }

    if (validStatus >= 200 && validStatus <= 299) {
      this.logger.warn("successful status");
      return false;
    } else {
      this.logger.warn("error status");
      return true;
    }

    return null;
  }
}
