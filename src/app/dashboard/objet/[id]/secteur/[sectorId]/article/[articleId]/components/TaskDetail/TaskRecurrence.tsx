"use client";

import { Task } from "../../lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { RefreshCcw, AlertCircle } from "lucide-react";
import { formatDate, getPeriodLabel } from "../../lib/taskHelpers";

interface TaskRecurrenceProps {
  task: Task;
  isEditing: boolean;
  editedTask?: Partial<Task>;
  onTaskChange?: (updates: Partial<Task>) => void;
}

export function TaskRecurrence({
  task,
  isEditing,
  editedTask,
  onTaskChange,
}: TaskRecurrenceProps) {
  const currentTask = editedTask || task;

  // Editing mode
  if (isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 text-primary" />
            Configuration de la récurrence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring-edit"
                checked={currentTask.recurring}
                onChange={(e) =>
                  onTaskChange?.({
                    recurring: e.target.checked,
                  })
                }
                className="w-4 h-4 text-primary rounded border-input focus:ring-ring"
              />
              <Label htmlFor="recurring-edit" className="text-sm font-medium">
                Tâche récurrente
              </Label>
            </div>

            {currentTask.recurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-primary">
                <div>
                  <Label className="text-xs font-medium mb-1 block">
                    Périodicité
                  </Label>
                  <Select
                    value={currentTask.period || "weekly"}
                    onValueChange={(value) =>
                      onTaskChange?.({
                        period: value,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                      <SelectItem value="quarterly">Trimestrielle</SelectItem>
                      <SelectItem value="yearly">Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1 block">
                    Date de fin
                  </Label>
                  <Input
                    type="date"
                    value={
                      currentTask.endDate
                        ? new Date(currentTask.endDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      onTaskChange?.({
                        endDate: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display mode - only show if task is recurring
  if (!task.recurring) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-primary" />
          Récurrence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-center p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
            <Badge variant="secondary" className="text-xs mb-2">
              {getPeriodLabel(task.period)}
            </Badge>
            {task.realizationDate && (
              <div className="text-xs text-muted-foreground mt-1">
                Prochaine: {formatDate(task.realizationDate)}
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              Une nouvelle instance sera créée automatiquement
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
